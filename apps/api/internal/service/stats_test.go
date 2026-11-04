package service

import (
	"context"
	"testing"

	"github.com/codingfoding/api/internal/domain"
)

func TestPathStatsCountsEveryStage(t *testing.T) {
	h := newAuthHarness(t)
	h.register(t, "a@example.com", "aaa", domain.LocaleEN) // defaults to "why"
	code := h.requestCode(t, "b@example.com")
	res, err := h.svc.VerifyEmailCode(context.Background(), "b@example.com", code)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := h.svc.CompleteSignup(context.Background(), SignupInput{
		Token: res.SignupToken, DisplayName: "B", District: "dhaka", Interests: []string{"dsa"}, Stage: "dsa", Password: "long enough pw",
	}, ClientInfo{}); err != nil {
		t.Fatal(err)
	}
	st, err := NewStatsService(fakeUsers{h.store}).Path(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if st.Total != 2 || st.Stages["why"] != 1 || st.Stages["dsa"] != 1 {
		t.Fatalf("got %+v", st)
	}
	if len(st.Stages) != len(domain.JourneyStages) || st.Stages["goal"] != 0 {
		t.Fatalf("every stage should be present (zeros included): %+v", st.Stages)
	}
}
