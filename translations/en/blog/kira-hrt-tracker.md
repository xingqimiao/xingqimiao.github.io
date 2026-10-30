---
title: 'Kira HRT Tracker: our HRT logging tool'
---

Hello, little cat. It has been a while.

First, a small question: have you ever sat staring at a pill box, your mind suddenly blank, unable to remember whether you already took today's dose?

Or counted back through the calendar trying to work out when you last injected, then squinted at a blood test full of numbers wondering — is that high, or is that low?

Small things, all of them. But piled into daily life they wear you down, especially when you are the only one keeping track, quietly, in your head.

Because we kept feeling the lack of a tool that simply fits the hand, we built one: **Kira HRT Tracker**, a free, GPL-3.0 open-source tool for logging HRT. It records every dose, turns dry milligrams into an estimated blood-level curve, and calibrates that curve against your own blood tests so it drifts closer to your actual body. It never makes a decision for you. It just sits beside you like a big calm cat with its paws tucked in, keeping the days straight.

It is finished now, and we really want you to try it:
https://hrt.kiramyao.com (the web version installs as a PWA, an Android build is available, and the interface speaks seven languages)

If you would rather read slowly first, there is an official introduction page: https://hrt.kiramyao.com/about/ — every feature is explained in more detail there, along with the full list of supported medications.

## The two features we are proudest of

### 1. Two calculation models with live calibration

Working out a blood-level curve is more subtle than it looks. Different open-source teams make different mathematical assumptions about how a drug is absorbed and cleared. Instead of choosing for you, we put both complete models in, and you can switch between them in settings at any time:

- **the original model (Mihari)**: ported from Mihari's PKcomponent with minimal changes, so the curve matches what you saw in the classic tools.
- **the Transmtf model**: from the Transmtf team, extending the same approach with three-compartment gel absorption, two-phase injection release, layered sublingual absorption and long-acting EU ester simulation. Because it focuses on oestradiol, it is available in feminising mode only.

If you only use ordinary injections, patches or pills, the two models draw almost the same trend. If you use gel or testosterone undecanoate injections, their predictions for the absorption peak separate.

That is when a real blood test earns its keep. Settings offers four calibration options — **off, Hybrid-MIPD (recommended), EKF, OU-Kalman** — and the curve sensibly ignores the occasional outlier, so one nervous draw or mistimed test does not drag the whole line off course. There is also a live waveform preview: watching each new blood test pull the estimate back onto your body's track is oddly soothing. You can also pick *retrospective* calibration (recompute the whole history from all your tests) or *forward* calibration (each point only uses what was known at the time).

Having both models in one tool with live before/after comparison is something we spent a long time on, and we really recommend opening settings and playing with it.

![Two pharmacokinetic models and four calibration options (off, EKF, OU-Kalman, Hybrid-MIPD)](/pic/blog/kira-hrt-tracker-models.png)

### 2. MCP: let an AI assistant read your body's rhythm

If you already talk to Claude, ChatGPT or a local model about your body and your days, you no longer have to export files by hand and paste them in.

Kira HRT Tracker supports the **Model Context Protocol (MCP)** natively. Generate a personal token in the app, give it to an MCP-capable assistant, and within the permissions you granted it can read and write your records directly: past doses, blood tests and estimated curves. You can even say "I just applied 2.6mg of gel, log it for me" and it will record the dose and talk through the current curve with you.

Treat the token like a small hidden key: it is shown once, at creation, so keep it safe. This, too, is something only available here.

![MCP data bridge: let an AI assistant work with your dose records](/pic/blog/kira-hrt-tracker-03.png)

## Every dose, logged carefully, with reminders that don't nag

- **Every route you actually use**: injections, oral, sublingual, gel and patches. Patches record application and removal separately and count how long one has been worn; sublingual doses can carry a detailed absorption tier; gel records the site, the product, the area covered and whether it was washed off.
- **A full medication list (nine groups)**: oestradiol in oral, sublingual, gel, patch and injectable forms (the whole EV, EN, EC, EB, EU family); anti-androgens including cyproterone acetate, spironolactone, bicalutamide and GnRH analogues; micronised progesterone, raloxifene, testosterone in every form (gel, TC, TE, TU), plus medroxyprogesterone acetate and norethisterone for cyclic use and finasteride or dutasteride for hair.
- **Two-way HRT mode**: whether you are a trans woman or a trans man, the medications and routes on offer adapt to your mode.
- **Reminders that don't let a dose slip by**: set a schedule by times per day, by hours between doses, or by days between doses. If the time passes without a check-in, a gentle pop-up appears, and a missed dose can be logged retroactively in one tap. Overdue doses trigger a follow-up FCM push (de-duplicated across two logged-in devices, so it never nags twice), and lock-screen notification detail can be hidden to keep daily life private. When liver or hormone rechecks come due, it reminds you — no more relying on memory for that.

![Dose-plan settings and the reminder pop-up for an untaken dose](/pic/blog/kira-hrt-tracker-reminder.png)

## Shortcuts: templates and reading a lab slip by camera

Keeping track of your body should feel like company, not like a daily chore, so anywhere we could save you effort, we did:

- **Quick templates**: save a fixed daily regimen as a template, then one tap on the home screen logs it. No more re-picking the route and retyping the dose.
- **Lab-slip capture**: after a recheck, you no longer have to type a page of abbreviations and decimals by hand. Photograph the slip and an on-device neural network finds the oestradiol (E2) and testosterone (T) values and fills the form; check it and save. The photo never leaves your device — nothing is uploaded.

![Quick logging templates and automatic lab-slip recognition](/pic/blog/kira-hrt-tracker-05.png)

## The curve — and a 4-hour candlestick chart for "trader cats"

Every logged dose redraws a smooth estimated blood-level curve on the home screen, so the rise and fall of your hormones, and their metabolic half-lives, are visible at a glance.

We also tucked in a small indulgence: **a one-tap switch to a 4-hour candlestick view**. It is a view built for the "trader cats" — if you already spend your days reading candles, you may as well look at your own hormone market in the same familiar way. Each 4-hour period shows open, close, peak and trough as a clearly drawn body. Nobody said serious charting and taking care of yourself can't happen at once.

![The smooth concentration curve and the 4-hour candlestick view for trader cats](/pic/blog/kira-hrt-tracker-curve.png)

## New phone, no worry: your data is covered

- **Seamless sync across devices**: log in and your history and dose plans follow you to a new phone or to the web. No account and completely offline also works, with every feature available.
- **Hardware-grade encryption**: with cloud sync on, data is encrypted by your password and a hardware security module (HSM) together, and even a read-only share link leaves no plaintext on the server.
- **Export and offline backup at any time**: the data is yours; export the full record whenever you want it.
- **Fully open source**: the whole project is public on GitHub under GPL-3.0, and anyone can inspect how data is stored and calculated.

## Coming from another tool

If you have been using Oyama, Transmtf or Featherline, you can import their history in one step. Packing takes a second, and moving in doesn't mean starting from scratch.

## Languages and installation

- **Languages**: Simplified Chinese, Traditional Chinese, Cantonese, English, Japanese, Korean, Turkish.
- **Platforms**: add the web version to your desktop as a PWA, or install the native Android build (which updates itself from inside the app).

## Open source and thanks

Kira HRT Tracker is built by Kira (the cat) and released under GPL-3.0. The original model is ported from Mihari's PKcomponent, the Transmtf model comes from the Transmtf team, and the calibration approach draws on hrt.transmtf.com. Our deep thanks to everyone in the open-source community who walked this path before us.

## Questions people ask

**Is Kira HRT Tracker free?**
Completely free, and open source under GPL-3.0. Use it freely.

**Can I use it before I have any blood tests?**
Of course. Without test results the curve shows the model's theoretical estimate. Turn calibration on whenever your first results arrive.

**Which of the two models should I choose?**
For injections, patches or pills alone, the trends are nearly identical. With gel, the two models make different absorption assumptions and the curve height differs by roughly a factor of two; with testosterone undecanoate the shape differs too. Either way, once you enter a blood test and switch calibration on, the measured values pull the curve onto your body.

**Can it replace my doctor's advice?**
No. It is a logging and reference tool: the curve is a mathematical estimate, not a diagnosis and not a prescription. Any change in medication or dose belongs in a conversation with your doctor.

**What is MCP?**
A general way for an AI assistant to connect to external tools. Generate a token here and an MCP-capable assistant can read and write your records directly, without manual import and export.

## Try it

Open https://hrt.kiramyao.com for the web version, or install the Android build. It is a small tool we built with care, and we would genuinely like you to click around in it. If you want to read the source, or you hit a problem or have an idea, the project's GitHub page is where to find us.

Wherever you are and whatever stage you are at, you are not alone. The road ahead is long; there is no hurry to fly. Step by step. And those small numbers that are so easy to forget — leave them to this big cat, who will keep them for you.

![May the world treat us gently, and may we bloom freely and brightly](/pic/blog/kira-hrt-tracker-06.png)
