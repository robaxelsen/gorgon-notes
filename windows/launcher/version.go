package main

import (
	"strconv"
	"strings"
)

// Versions are release tags ("v0.1.0", "v0.2.1") or local builds ("dev-2026-10-24-2213").
// Any tag outranks any dev build; tags compare numerically; dev builds compare by their stamp.
type version struct {
	tag   bool
	parts [3]int
	raw   string
}

func parseVersion(s string) version {
	s = strings.TrimSpace(s)
	v := version{raw: s}
	if !strings.HasPrefix(s, "v") {
		return v
	}
	for i, p := range strings.SplitN(strings.TrimPrefix(s, "v"), ".", 3) {
		n, err := strconv.Atoi(strings.TrimSpace(p))
		if err != nil {
			return version{raw: s} // not a tag we understand: treated like a dev build
		}
		v.parts[i] = n
	}
	v.tag = true
	return v
}

// newer reports whether a is a strictly newer version than b. An empty b is older than anything.
func newer(a, b string) bool {
	va, vb := parseVersion(a), parseVersion(b)
	if va.raw == "" {
		return false
	}
	if vb.raw == "" {
		return true
	}
	if va.tag != vb.tag {
		return va.tag
	}
	if va.tag {
		return va.parts != vb.parts && (va.parts[0] > vb.parts[0] ||
			va.parts[0] == vb.parts[0] && (va.parts[1] > vb.parts[1] ||
				va.parts[1] == vb.parts[1] && va.parts[2] > vb.parts[2]))
	}
	return va.raw > vb.raw
}
