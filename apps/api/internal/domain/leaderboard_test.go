package domain

import (
	"slices"
	"testing"
)

func TestBoardsFor(t *testing.T) {
	div, dist := "dhaka", "gazipur"
	got := BoardsFor(&div, &dist)
	if want := []string{"", "div:dhaka", "dist:gazipur"}; !slices.Equal(got, want) {
		t.Fatalf("BoardsFor = %q, want %q", got, want)
	}
	if got := BoardsFor(nil, nil); !slices.Equal(got, []string{""}) {
		t.Fatalf("no division/district: %q", got)
	}
}

func TestValidBoard(t *testing.T) {
	for name, ok := range map[string]bool{
		"": true, "div:dhaka": true, "dist:dhaka": true, "dist:coxsbazar": true,
		"dhaka": false, "div:gazipur": false, "dist:atlantis": false, "div:": false, "xp:all": false,
	} {
		if ValidBoard(name) != ok {
			t.Errorf("ValidBoard(%q) = %v, want %v", name, !ok, ok)
		}
	}
}

func TestRanked(t *testing.T) {
	cases := []struct {
		role    Role
		account string
		want    bool
	}{
		{RoleLearner, AccountLearner, true},
		{RoleMentor, AccountLearner, true},
		{RoleAdmin, AccountLearner, false},
		{RoleLearner, AccountCompany, false},
	}
	for _, c := range cases {
		if got := Ranked(c.role, c.account); got != c.want {
			t.Errorf("Ranked(%s, %s) = %v, want %v", c.role, c.account, got, c.want)
		}
	}
}
