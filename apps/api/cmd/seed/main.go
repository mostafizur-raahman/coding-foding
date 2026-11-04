// Command seed loads demo data and creates coupons.
//
//	seed -careers          fictional companies + jobs for the careers portal
//	seed -careers -remove  delete every demo company and job (and applications to them)
//	seed -roadmap          starter roadmap items (existing slugs are left untouched)
//	seed -coupon EID20 -percent 20 [-max 100] [-days 7] [-plans yearly]
//	                       create or update a coupon (-off to deactivate it)
package main

import (
	"context"
	_ "embed"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/codingfoding/api/internal/config"
	"github.com/codingfoding/api/internal/repository/postgres"
)

//go:embed careers_demo.sql
var careersDemo string

//go:embed roadmap.sql
var roadmapSeed string

func main() {
	careers := flag.Bool("careers", false, "seed demo companies and jobs")
	remove := flag.Bool("remove", false, "remove the demo data instead")
	roadmap := flag.Bool("roadmap", false, "seed the starter roadmap")
	var c couponFlags
	flag.StringVar(&c.code, "coupon", "", "coupon code to create or update")
	flag.IntVar(&c.percent, "percent", 0, "coupon: percent off (1–90)")
	flag.IntVar(&c.max, "max", 0, "coupon: total redemptions allowed (0 = unlimited)")
	flag.IntVar(&c.days, "days", 0, "coupon: valid for this many days from now (0 = no end)")
	flag.StringVar(&c.plans, "plans", "", "coupon: comma-separated plans (empty = all)")
	flag.BoolVar(&c.off, "off", false, "coupon: deactivate it")
	flag.Parse()
	var err error
	switch {
	case c.code != "":
		err = coupon(c)
	case *careers:
		err = run(*remove)
	case *roadmap:
		err = seedRoadmap()
	default:
		flag.Usage()
		os.Exit(2)
	}
	if err != nil {
		slog.Error("seed failed", "err", err)
		os.Exit(1)
	}
}

func run(remove bool) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL, 2)
	if err != nil {
		return err
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if remove {
		// Jobs and their applications go with the company (ON DELETE CASCADE).
		tag, err := tx.Exec(ctx, `DELETE FROM jobs WHERE is_demo`)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `DELETE FROM companies WHERE is_demo AND NOT EXISTS (SELECT 1 FROM jobs WHERE jobs.company_id = companies.id)`); err != nil {
			return err
		}
		slog.Info("demo careers removed", "jobs", tag.RowsAffected())
	} else {
		if _, err := tx.Exec(ctx, careersDemo); err != nil {
			return err
		}
		var n int
		if err := tx.QueryRow(ctx, `SELECT count(*) FROM jobs WHERE is_demo`).Scan(&n); err != nil {
			return err
		}
		slog.Info("demo careers seeded", "jobs", n)
	}
	return tx.Commit(ctx)
}

func seedRoadmap() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL, 2)
	if err != nil {
		return err
	}
	defer pool.Close()
	tag, err := pool.Exec(ctx, roadmapSeed)
	if err != nil {
		return err
	}
	slog.Info("roadmap seeded", "added", tag.RowsAffected())
	return nil
}

type couponFlags struct {
	code, plans        string
	percent, max, days int
	off                bool
}

var couponCodeRe = regexp.MustCompile(`^[A-Z0-9-]{3,32}$`)

func coupon(f couponFlags) error {
	code := strings.ToUpper(strings.TrimSpace(f.code))
	if !couponCodeRe.MatchString(code) {
		return fmt.Errorf("coupon code must be 3–32 of A-Z, 0-9, -")
	}
	if !f.off && (f.percent < 1 || f.percent > 90) {
		return fmt.Errorf("-percent must be 1–90")
	}
	plans := []string{}
	for _, p := range strings.Split(f.plans, ",") {
		if p = strings.TrimSpace(p); p != "" {
			if p != "monthly" && p != "yearly" {
				return fmt.Errorf("unknown plan %q", p)
			}
			plans = append(plans, p)
		}
	}
	var max *int
	if f.max > 0 {
		max = &f.max
	}
	var until *time.Time
	if f.days > 0 {
		t := time.Now().AddDate(0, 0, f.days)
		until = &t
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx := context.Background()
	pool, err := postgres.Connect(ctx, cfg.DatabaseURL, 2)
	if err != nil {
		return err
	}
	defer pool.Close()
	if f.off {
		if _, err := pool.Exec(ctx, `UPDATE coupons SET is_active = false WHERE code = $1`, code); err != nil {
			return err
		}
		slog.Info("coupon deactivated", "code", code)
		return nil
	}
	_, err = pool.Exec(ctx, `
		INSERT INTO coupons (code, percent_off, plans, max_redemptions, valid_until, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
		ON CONFLICT (code) DO UPDATE SET percent_off = excluded.percent_off, plans = excluded.plans,
		  max_redemptions = excluded.max_redemptions, valid_until = excluded.valid_until, is_active = true`,
		code, f.percent, plans, max, until)
	if err != nil {
		return err
	}
	slog.Info("coupon saved", "code", code, "percent_off", f.percent, "plans", plans, "max", f.max, "valid_until", until)
	return nil
}
