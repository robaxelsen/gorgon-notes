package main

import "testing"

func TestNewer(t *testing.T) {
	cases := []struct {
		a, b string
		want bool
	}{
		{"v0.1.0", "", true},
		{"", "v0.1.0", false},
		{"v0.1.0", "v0.1.0", false},
		{"v0.2.0", "v0.1.9", true},
		{"v0.1.9", "v0.2.0", false},
		{"v1.0.0", "v0.99.99", true},
		{"v0.1.10", "v0.1.9", true},
		{"v0.1.0", "dev-2026-10-24-2213", true},
		{"dev-2026-10-24-2213", "v0.1.0", false},
		{"dev-2026-10-25-0001", "dev-2026-10-24-2213", true},
		{"dev-2026-10-24-2213", "dev-2026-10-24-2213", false},
		{"v0.1.0\n", "v0.0.9", true},
	}
	for _, c := range cases {
		if got := newer(c.a, c.b); got != c.want {
			t.Errorf("newer(%q, %q) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}
