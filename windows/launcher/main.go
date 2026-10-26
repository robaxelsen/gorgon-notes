// GorgonNotes.exe: the Windows program for Gorgon Notes, built from the Mac (GOOS=windows, no cgo).
//
// It embeds the zip that windows/build.sh makes (server.py + static/ + cache/ + the python.org
// embeddable Python), unpacks it once into %LOCALAPPDATA%\Gorgon Notes\app, starts
// python\python.exe server.py hidden, waits for the port, and shows the web UI in its own window
// (WebView2, the engine Windows ships with Edge; ui_windows.go). Closing the window stops the server.
// No console: everything is written to %LOCALAPPDATA%\Gorgon Notes\gorgon-notes.log.
//
// Updates: when built with -X main.repo=<owner>/<name>, each start fetches
// https://github.com/<owner>/<name>/releases/latest/download/version.txt (4 s budget) and, if that is
// newer than what is installed, downloads GorgonNotes-windows.zip from the same place and unpacks it
// over the app folder before starting. The exe itself never changes; it is only a shell around the
// Python server, like mac/GorgonNotes/main.swift. GN_NO_UPDATE=1 skips the check; GN_UPDATE_URL
// overrides the base URL (used by the Mac smoke test).
package main

import (
	"archive/zip"
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

//go:embed payload.zip
var payload []byte

// Set by -ldflags "-X main.build=<version> -X main.repo=<owner>/<name>" (windows/build.sh).
var (
	build = "dev"
	repo  = ""
)

const (
	appName     = "Gorgon Notes"
	defaultPort = "8787"
	startWait   = 30 * time.Second
	versionWait = 4 * time.Second
	zipWait     = 2 * time.Minute
	zipAsset    = "GorgonNotes-windows.zip"
)

var logFile *os.File

func logf(format string, a ...any) {
	line := fmt.Sprintf(time.Now().Format("15:04:05")+" "+format+"\n", a...)
	if logFile != nil {
		logFile.WriteString(line)
	}
	if runtime.GOOS != "windows" {
		fmt.Print(line)
	}
}

func main() {
	if err := run(); err != nil {
		logf("error: %v", err)
		alert(appName+" could not start", err.Error())
		os.Exit(1)
	}
}

func run() error {
	base, err := os.UserCacheDir() // %LOCALAPPDATA% on Windows
	if err != nil {
		return err
	}
	root := filepath.Join(base, appName)
	app := filepath.Join(root, "app")
	if err := os.MkdirAll(app, 0o755); err != nil {
		return err
	}
	logPath := filepath.Join(root, "gorgon-notes.log")
	logFile, _ = os.Create(logPath)
	defer func() {
		if logFile != nil {
			logFile.Close()
		}
	}()
	logf("%s %s (repo %q), files in %s", appName, build, repo, app)

	if err := install(app); err != nil {
		return err
	}

	port := os.Getenv("PG_PORT")
	if port == "" {
		port = defaultPort
	}
	url := "http://127.0.0.1:" + port + "/"

	// Another copy already serving? If it is this build, just show the window. If it is an older build (the
	// window of an earlier start is still open, or its server was orphaned), ask it to quit (POST /api/quit,
	// since v0.7.1) and start this build's server; an older server without that route just keeps running and
	// the page says what to do.
	var server *exec.Cmd
	if listening(port) {
		if v := runningVersion(url); v != "" && v != build {
			logf("port %s answers with %s, this build is %s: asking it to quit", port, v, build)
			if _, err := post(url+"api/quit", 3*time.Second); err != nil {
				logf("quit request failed: %v", err)
			}
			for i := 0; i < 40 && listening(port); i++ {
				time.Sleep(150 * time.Millisecond)
			}
		}
	}
	if !listening(port) {
		python := filepath.Join(app, "python", "python.exe")
		if runtime.GOOS != "windows" { // Mac smoke test of this launcher only
			python = "python3"
		}
		server = exec.Command(python, filepath.Join(app, "server.py"))
		server.Dir = app
		server.Env = append(os.Environ(), "PYTHONUTF8=1", "PYTHONDONTWRITEBYTECODE=1", "PG_PORT="+port)
		server.Stdout, server.Stderr = logFile, logFile
		hideWindow(server)
		if err := server.Start(); err != nil {
			return fmt.Errorf("starting the server (%s): %w", python, err)
		}
		exited := make(chan error, 1)
		go func() { exited <- server.Wait() }()
		deadline := time.Now().Add(startWait)
		for !listening(port) {
			select {
			case <-exited:
				return fmt.Errorf("the server stopped right away. Its last lines:\n\n%s\n(full log: %s)", tail(logPath, 6), logPath)
			default:
			}
			if time.Now().After(deadline) {
				server.Process.Kill()
				return fmt.Errorf("the server did not answer on port %s within %s (log: %s)", port, startWait, logPath)
			}
			time.Sleep(150 * time.Millisecond)
		}
		logf("server up on %s", url)
	} else {
		logf("port %s already answers; using the running server", port)
	}

	showUI(url, filepath.Join(root, "webview2"))

	if server != nil {
		logf("window closed; stopping the server")
		server.Process.Kill()
	}
	return nil
}

// install makes sure the newest build available is unpacked in app: the embedded payload if it is
// newer than what build.txt records, then the latest GitHub release if that is newer still. A failed
// update check or download is logged and otherwise ignored; what is installed keeps working.
func install(app string) error {
	stampPath := filepath.Join(app, "build.txt")
	cur, _ := os.ReadFile(stampPath)
	installed := strings.TrimSpace(string(cur))
	if newer(build, installed) {
		logf("unpacking embedded build %s (installed: %q)", build, installed)
		if err := unpack(payload, app); err != nil {
			return fmt.Errorf("unpacking into %s: %w", app, err)
		}
		if err := os.WriteFile(stampPath, []byte(build+"\n"), 0o644); err != nil {
			return err
		}
		installed = build
	}
	if repo == "" || os.Getenv("GN_NO_UPDATE") != "" {
		return nil
	}
	base := os.Getenv("GN_UPDATE_URL")
	if base == "" {
		base = "https://github.com/" + repo + "/releases/latest/download/"
	}
	remote, err := fetch(base+"version.txt", versionWait)
	if err != nil {
		logf("update check skipped: %v", err)
		return nil
	}
	latest := strings.TrimSpace(string(remote))
	if !newer(latest, installed) {
		logf("up to date (%s; latest release %s)", installed, latest)
		return nil
	}
	logf("update %s -> %s: downloading %s", installed, latest, base+zipAsset)
	data, err := fetch(base+zipAsset, zipWait)
	if err != nil {
		logf("update download failed, keeping %s: %v", installed, err)
		return nil
	}
	if err := unpack(data, app); err != nil {
		logf("update unpack failed, keeping %s: %v", installed, err)
		return nil
	}
	if err := os.WriteFile(stampPath, []byte(latest+"\n"), 0o644); err != nil {
		return err
	}
	logf("updated to %s", latest)
	return nil
}

func fetch(url string, timeout time.Duration) ([]byte, error) {
	client := &http.Client{Timeout: timeout}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "gorgon-notes-launcher/"+build)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("%s: HTTP %d", url, resp.StatusCode)
	}
	return io.ReadAll(io.LimitReader(resp.Body, 200<<20))
}

// runningVersion asks the server on url for its version ("" when it does not answer or is too old to say).
func runningVersion(url string) string {
	data, err := fetch(url+"api/health", 15*time.Second)
	if err != nil {
		return ""
	}
	var h struct {
		App struct {
			Version string `json:"version"`
		} `json:"app"`
	}
	if json.Unmarshal(data, &h) != nil {
		return ""
	}
	return h.App.Version
}

func post(url string, timeout time.Duration) ([]byte, error) {
	client := &http.Client{Timeout: timeout}
	req, err := http.NewRequest("POST", url, strings.NewReader("{}"))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "gorgon-notes-launcher/"+build)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(io.LimitReader(resp.Body, 1<<20))
}

func listening(port string) bool {
	c, err := net.DialTimeout("tcp", "127.0.0.1:"+port, 300*time.Millisecond)
	if err != nil {
		return false
	}
	c.Close()
	return true
}

// tail returns the last n non-empty lines of the log that the server wrote (the launcher's own
// timestamped lines are skipped): its own words on what went wrong.
func tail(path string, n int) string {
	if logFile != nil {
		logFile.Sync()
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	var lines []string
	for _, l := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		l = strings.TrimRight(l, "\r")
		if strings.TrimSpace(l) == "" || (len(l) > 9 && l[2] == ':' && l[5] == ':' && l[8] == ' ') {
			continue
		}
		lines = append(lines, l)
	}
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return strings.Join(lines, "\n")
}

// unpack writes every file of a zip under dir, dropping the zip's single top folder.
// Existing files are overwritten; nothing is deleted, so capacity.json (the player's own data)
// and older cache/ versions survive an upgrade.
func unpack(data []byte, dir string) error {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return err
	}
	for _, f := range zr.File {
		name := f.Name
		if i := strings.IndexByte(name, '/'); i >= 0 {
			name = name[i+1:] // strip "GorgonNotes-windows/"
		}
		if name == "" || strings.HasSuffix(name, "/") {
			continue
		}
		dst := filepath.Join(dir, filepath.FromSlash(name))
		if !strings.HasPrefix(dst, dir+string(filepath.Separator)) {
			return fmt.Errorf("unsafe path in zip: %s", f.Name)
		}
		if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
			return err
		}
		if err := writeFile(f, dst); err != nil {
			return fmt.Errorf("%s: %w", name, err)
		}
	}
	return nil
}

func writeFile(f *zip.File, dst string) error {
	src, err := f.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, src); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}
