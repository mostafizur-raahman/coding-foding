// Package clock abstracts time so services are deterministic under test.
package clock

import "time"

type Clock interface{ Now() time.Time }

type System struct{}

func (System) Now() time.Time { return time.Now() }

type Fixed struct{ T time.Time }

func (f *Fixed) Now() time.Time { return f.T }

func (f *Fixed) Advance(d time.Duration) { f.T = f.T.Add(d) }

// Dhaka is the timezone used for streak calendar days.
var Dhaka = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Dhaka")
	if err != nil {
		return time.FixedZone("Asia/Dhaka", 6*60*60) // BD has no DST
	}
	return loc
}()

// Day truncates t to midnight of its calendar day in loc, returned as a UTC date.
func Day(t time.Time, loc *time.Location) time.Time {
	y, m, d := t.In(loc).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}
