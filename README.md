# QA Automation Portfolio

End-to-end UI and API test automation built with **Playwright** and
**TypeScript**, running in CI on every push and on a weekly schedule.

[![Tests](https://github.com/Abadalina/qa-automation-portfolio/actions/workflows/tests.yml/badge.svg)](https://github.com/Abadalina/qa-automation-portfolio/actions/workflows/tests.yml)
[![Allure report](https://img.shields.io/badge/Allure-report-blueviolet)](https://Abadalina.github.io/qa-automation-portfolio/)

**81 tests** — 22 UI cases across three browser profiles, plus 15 API cases.

---

## What this is

A deliberately small automation suite, built to work through the decisions
rather than to pile up test count: what is worth automating, how to keep
selectors stable, and how to make results readable to someone who is not in QA.

It runs against two applications published for exactly this purpose:

| Layer | Target | What it covers |
|---|---|---|
| **UI** | [saucedemo.com](https://www.saucedemo.com) | Login, catalogue sorting, cart, full checkout |
| **API** | [restful-booker.herokuapp.com](https://restful-booker.herokuapp.com) | Token auth, booking CRUD, authorisation on destructive endpoints |

Neither is a real company's production system. Automating against a system you
do not own is a legal problem before it is a technical one.

## Stack

**Playwright** · **TypeScript** · **Page Object Model** · **GitHub Actions** ·
**Allure**

## Running it locally

```bash
git clone https://github.com/Abadalina/qa-automation-portfolio.git
cd qa-automation-portfolio
npm ci
npx playwright install
npm test
```

Other useful commands:

```bash
npm run test:api        # API suite only (no browser, ~3 s)
npm run test:chromium   # UI suite, Chromium only
npm run ui              # Playwright's interactive UI mode
npm run test:headed     # watch the browser while it runs
npm run report          # open the HTML report of the last run
npm run typecheck       # tsc, no emit
```

## Structure

```
.
├── .github/workflows/tests.yml   # CI: matrix of 4 projects, weekly schedule
├── tests/
│   ├── ui/                       # login · cart · checkout
│   └── api/                      # auth · booking
├── pages/                        # Page Object Model — every selector lives here
├── fixtures/                     # test data, no literals in the specs
├── docs/TEST_STRATEGY.md         # the reasoning behind all of it
└── playwright.config.ts
```

## Test strategy

The full write-up is in **[docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md)**. The
short version:

**Scope.** The UI suite covers the critical path of an e-commerce flow —
authentication, cart and checkout. The API suite covers CRUD and authorisation
on a booking service.

**What I automated and why.** Flows that are regression-prone, deterministic and
run identically on every build: login, cart state, completing a purchase. Those
earn back their upfront cost. API coverage is pushed further than UI coverage
simply because it is an order of magnitude cheaper to run.

**What I deliberately did not automate.** Visual layout and usability — a machine
can confirm a button exists, not that a screen makes sense. Anything I would
expect to churn, because a test that breaks weekly costs more than it saves. And
exhaustive field permutations through the UI, where the same logic is reachable
through the API.

**Test case design.** Cases are grouped into happy path, negative, boundary,
state and security rather than listed flat, so the gaps are visible.

**Selectors.** Dedicated `data-test` attributes, never CSS classes or visible
text — those break on a restyle or a translation, neither of which is a change
in behaviour.

**Flakiness.** Retries are on in CI, off locally. Retries stop a transient
network failure from blocking the pipeline, but they also hide genuinely flaky
tests — so a test that only passes on retry is treated as a bug to investigate,
not a pass. Traces are captured on first retry so there is something to look at.

**Test data.** Centralised in `fixtures/`. The committed credentials are the
public demo accounts printed on the targets' own documentation; in a real
project they would be environment variables and never committed.

## A note on the security cases

Three of the tests check that the system does not leak or over-permit, rather
than that a feature works:

- **Account enumeration** — a wrong password and a non-existent username must
  produce the *same* error. The test compares the two responses to each other,
  so it survives a wording change and fails on a behaviour change.
- **Broken access control** — navigating directly to `/inventory.html` without a
  session must not render the page.
- **Authorisation on delete** — `DELETE /booking/:id` is checked with a valid
  token, with no token, and with a forged one. The forged-token case also
  asserts the record still exists afterwards, because a 403 response tells you
  nothing about whether the deletion happened anyway.

## Continuous integration

`.github/workflows/tests.yml` runs on every push and PR to `main`, and every
Monday at 06:00 UTC.

- Four matrix legs — `api`, `chromium`, `firefox`, `mobile` — with
  `fail-fast: false`, so a browser-specific failure is not masked by cancelling
  the rest.
- Each leg installs only the browser it needs.
- Type check runs before the suite, so a broken refactor fails in seconds.
- Reports upload with `if: always()`, which is the only way to get artefacts from
  the runs that actually failed.
- The Allure report is published to GitHub Pages, with history carried over so
  trends are visible across runs.

The weekly schedule matters more than it looks: the suite runs against live
external sites, so it can break with no commit involved.

## What I would do differently at scale

- Set up state through the API and inject `storageState` instead of driving the
  login form as a precondition in every test — faster, and one less point of
  failure.
- Run against an environment I control, with seeded data, rather than inheriting
  a third-party demo site's downtime as my own flakiness.
- Add visual regression coverage (`toHaveScreenshot`) for the layout gap
  functional assertions structurally cannot close.
- Add response schema validation, so an API contract break is caught directly
  rather than via whichever UI test happens to trip over it.
- Drive the device matrix from real browser analytics instead of three fixed
  projects.
- Track per-test flakiness over time and quarantine on a threshold, rather than
  letting the team learn to ignore red.

## Licence

MIT
