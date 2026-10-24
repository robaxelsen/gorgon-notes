//go:build !windows

// Mac stand-in so the launcher's unpack / start / wait / stop logic can be smoke-tested here.
// It prints the URL and waits for Enter (or for GN_SMOKE_SECONDS to pass) instead of showing a window.
package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"time"
)

func alert(title, text string) { fmt.Fprintf(os.Stderr, "%s: %s\n", title, text) }

func hideWindow(cmd *exec.Cmd) {}

func showUI(url, dataDir string) {
	fmt.Printf("UI would open at %s (window data in %s). Press Enter to stop.\n", url, dataDir)
	if s, err := strconv.Atoi(os.Getenv("GN_SMOKE_SECONDS")); err == nil {
		time.Sleep(time.Duration(s) * time.Second)
		return
	}
	bufio.NewReader(os.Stdin).ReadString('\n')
}
