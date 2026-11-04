package service

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"

	"github.com/codingfoding/api/internal/domain"
)

type emailCopy struct {
	Subject, Heading, Body, CTA, Footer string
}

// bn copy follows the "developer Bangla" style: Bangla sentences, English tech terms.
var emailCopies = map[string]map[domain.Locale]emailCopy{
	"verify": {
		domain.LocaleEN: {"Verify your Coding Foding email", "Welcome aboard, {{.Name}} 👋",
			"Confirm your email to start your journey. This link expires in 24 hours.", "Verify email",
			"If you didn't create an account, you can ignore this email."},
		domain.LocaleBN: {"তোমার Coding Foding email verify করো", "স্বাগতম, {{.Name}} 👋",
			"Journey শুরু করার আগে email টা confirm করে নাও। এই link 24 ঘণ্টা পর expire হয়ে যাবে।", "Email verify করো",
			"Account তুমি না খুলে থাকলে এই email ignore করো।"},
	},
	"reset": {
		domain.LocaleEN: {"Reset your Coding Foding password", "Password reset requested",
			"Someone (hopefully you) asked to reset your password. This link expires in 30 minutes and signs out all devices.", "Reset password",
			"If this wasn't you, ignore this email — your password stays the same."},
		domain.LocaleBN: {"Coding Foding password reset করো", "Password reset এর request এসেছে",
			"কেউ (আশা করি তুমি) password reset করতে চেয়েছে। Link টা 30 মিনিট valid থাকবে, আর reset করলে সব device থেকে logout হয়ে যাবে।", "Password reset করো",
			"এটা তুমি না হলে email টা ignore করো, password আগের মতোই থাকবে।"},
	},
	"pro-approved": {
		domain.LocaleEN: {"Your Coding Foding Pro is active", "You're Pro now, {{.Name}} 🎉",
			"We verified your payment. Pro is active on your account — every track is open to you.", "Start learning",
			"Questions about this payment? Reply to this email."},
		domain.LocaleBN: {"তোমার Coding Foding Pro চালু হয়ে গেছে", "তুমি এখন Pro, {{.Name}} 🎉",
			"তোমার payment verify হয়ে গেছে। Account এ Pro চালু, সব track এখন তোমার জন্য খোলা।", "শেখা শুরু করো",
			"এই payment নিয়ে কোনো প্রশ্ন থাকলে এই email এ reply করো।"},
	},
	"pay-rejected": {
		domain.LocaleEN: {"We couldn't verify your Coding Foding payment", "Payment not verified",
			"We couldn't match your transaction ID with a payment we received. Check the ID and the amount, then submit again from checkout.", "Open checkout",
			"If you're sure you paid, reply to this email with a screenshot and we'll sort it out."},
		domain.LocaleBN: {"তোমার Coding Foding payment verify করা যায়নি", "Payment verify হয়নি",
			"তোমার transaction ID এর সাথে আমাদের কাছে আসা কোনো payment মেলেনি। ID আর amount টা check করে checkout থেকে আবার submit করো।", "Checkout এ যাও",
			"টাকা পাঠিয়েছ নিশ্চিত হলে screenshot সহ এই email এ reply করো, আমরা দেখে দিচ্ছি।"},
	},
}

var emailLayout = template.Must(template.New("email").Parse(`<!doctype html>
<html lang="{{.Lang}}"><body style="margin:0;background:#0E0F1A;font-family:Inter,'Hind Siliguri',Arial,sans-serif;color:#E8E9F3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#161827;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:700">coding<span style="color:#00D4A6">foding</span></td></tr>
<tr><td style="padding-top:24px;font-size:22px;font-weight:700">{{.Heading}}</td></tr>
<tr><td style="padding-top:12px;font-size:15px;line-height:1.75;color:#B4B7C9">{{.Body}}</td></tr>
<tr><td style="padding-top:28px"><a href="{{.Link}}" style="display:inline-block;background:linear-gradient(90deg,#7C5CFF,#00D4A6);color:#0E0F1A;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">{{.CTA}}</a></td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#6B6F80">{{.Footer}}</td></tr>
</table></td></tr></table></body></html>`))

func renderEmail(kind string, u *domain.User, link string) domain.Email {
	locale := u.PreferredLocale
	c, ok := emailCopies[kind][locale]
	if !ok {
		locale = domain.LocaleEN
		c = emailCopies[kind][locale]
	}
	// Plain substitution; the HTML layout escapes it exactly once.
	heading := strings.ReplaceAll(c.Heading, "{{.Name}}", u.DisplayName)
	var buf bytes.Buffer
	_ = emailLayout.Execute(&buf, map[string]string{
		"Lang": string(locale), "Heading": heading, "Body": c.Body, "CTA": c.CTA, "Footer": c.Footer, "Link": link,
	})
	return domain.Email{
		To:      u.Email,
		Subject: c.Subject,
		Text:    heading + "\n\n" + c.Body + "\n\n" + link + "\n\n" + c.Footer,
		HTML:    buf.String(),
	}
}

func verifyEmail(u *domain.User, link string) domain.Email { return renderEmail("verify", u, link) }

var codeCopies = map[domain.Locale]emailCopy{
	domain.LocaleEN: {"Your Coding Foding code: %s", "Your sign-in code", "Enter this code to continue. It expires in %d minutes.", "",
		"If you didn't try to sign in, ignore this email. Nobody can get in without this code."},
	domain.LocaleBN: {"তোমার Coding Foding code: %s", "তোমার sign-in code", "এগিয়ে যেতে এই code টা দাও। %d মিনিট পর এটা expire হয়ে যাবে।", "",
		"Sign in তুমি না করে থাকলে email টা ignore করো। এই code ছাড়া কেউ ঢুকতে পারবে না।"},
}

var codeLayout = template.Must(template.New("code").Parse(`<!doctype html>
<html lang="{{.Lang}}"><body style="margin:0;background:#0E0F1A;font-family:Inter,'Hind Siliguri',Arial,sans-serif;color:#E8E9F3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#161827;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:700">coding<span style="color:#00D4A6">foding</span></td></tr>
<tr><td style="padding-top:24px;font-size:22px;font-weight:700">{{.Heading}}</td></tr>
<tr><td style="padding-top:12px;font-size:15px;line-height:1.75;color:#B4B7C9">{{.Body}}</td></tr>
<tr><td style="padding-top:24px"><div style="display:inline-block;background:#0E0F1A;border:1px solid #2A2D45;border-radius:12px;padding:14px 22px;font-family:'JetBrains Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#00D4A6">{{.Code}}</div></td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#6B6F80">{{.Footer}}</td></tr>
</table></td></tr></table></body></html>`))

// codeEmail goes to an address that may not have an account yet, so it takes the
// address and locale directly rather than a *domain.User.
func codeEmail(to string, locale domain.Locale, code string, ttlMinutes int) domain.Email {
	c, ok := codeCopies[locale]
	if !ok {
		locale = domain.LocaleEN
		c = codeCopies[locale]
	}
	body := fmt.Sprintf(c.Body, ttlMinutes)
	var buf bytes.Buffer
	_ = codeLayout.Execute(&buf, map[string]string{
		"Lang": string(locale), "Heading": c.Heading, "Body": body, "Code": code, "Footer": c.Footer,
	})
	return domain.Email{
		To:      to,
		Subject: fmt.Sprintf(c.Subject, code),
		Text:    c.Heading + "\n\n" + code + "\n\n" + body + "\n\n" + c.Footer,
		HTML:    buf.String(),
	}
}
func resetEmail(u *domain.User, link string) domain.Email { return renderEmail("reset", u, link) }
