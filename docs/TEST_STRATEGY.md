# Test strategy

This document explains the decisions behind the suite. The tests themselves are
the easy part; what follows is the reasoning a reviewer cannot read off the code.

---

## 1. Scope and systems under test

| Layer | System under test | Why this one |
|---|---|---|
| UI | [Sauce Demo](https://www.saucedemo.com) | A complete e-commerce flow — login, catalogue, cart, checkout — with `data-test` attributes and users that fail on purpose, so negative cases are real rather than invented. |
| API | [Restful Booker](https://restful-booker.herokuapp.com) | Full CRUD plus token authentication, so authorisation can actually be tested. |

**Nothing here runs against a real company's production site.** Both targets are
published specifically for test practice. Pointing an automated suite at a
system you do not own is a legal and ethical problem before it is a technical
one, and a QA engineer should be the first person in the room to say so.

---

## 2. What is automated, and why

Automation pays for itself when a check is **repeated, deterministic and
expensive to do by hand**. Those three conditions pick the scope.

**Automated**

- **Authentication** — the gate in front of everything else. If it breaks, every
  other test is meaningless, so it is worth running on every build.
- **Cart operations** — high regression risk. State that survives navigation is
  exactly the kind of thing a refactor silently breaks.
- **Checkout, end to end** — the revenue path. One slow test that covers the
  whole flow is worth more than ten fast ones that cover none of it.
- **API CRUD and authorisation** — cheap, fast and stable. The natural place to
  push coverage, because it costs almost nothing to run.

**Deliberately not automated**

- **Visual design and usability.** A machine can assert that a button exists and
  is clickable. It cannot tell you the screen makes no sense. That is exploratory
  and manual work, and pretending otherwise produces tests that pass while the
  product is unusable.
- **Anything expected to churn.** A test that breaks every sprint because a label
  moved costs more maintenance than the bugs it catches.
- **Exhaustive field-level permutations through the UI.** Where the same logic is
  reachable through the API, it is tested there — dramatically faster and far
  less brittle.
- **Performance and load.** Different tooling, different question. Out of scope
  for a functional suite, and mixing them makes both worse.

---

## 3. Test case design

Cases are grouped by intent rather than listed flat, so gaps are visible at a
glance.

| Category | Example from this suite |
|---|---|
| **Happy path** | `valid credentials log the user in` · `a customer can complete a purchase end to end` |
| **Negative** | `wrong password shows an error` · `checkout requires a postal code` · `POST with a missing required field is rejected` |
| **Boundary / data** | `the order total is subtotal plus tax` — arithmetic verified against the fixture data, not hardcoded to one string |
| **State** | `the cart survives navigating away and back` · `the cart is emptied after a completed order` |
| **Security / authorisation** | `error message does not reveal whether the account exists` · `protected page cannot be reached without a session` · `DELETE with a forged token returns 403` |

The security group is the one that matters most in a financial context. Three
examples of what it covers:

- **Account enumeration.** A wrong password on a real account and a username that
  does not exist must return the *same* message. The test compares the two
  responses to each other rather than to a hardcoded string, so it keeps working
  if the wording changes but fails if the behaviour does.
- **Broken access control.** Navigating straight to `/inventory.html` without a
  session must not render the page. Client-side-only routing guards fail this.
- **Authorisation on destructive endpoints.** `DELETE /booking/:id` is checked
  three ways: with a valid token (succeeds), with no token (403), and with a
  forged token (403 *and the record is still there afterwards*). Asserting the
  status code alone would pass against a service that returns 403 and deletes
  the record anyway.

---

## 4. Locator strategy

Every selector targets a dedicated `data-test` attribute:

```typescript
this.loginButton = page.locator('[data-test="login-button"]');
```

Not CSS classes, not XPath, not visible text. Classes change when someone
restyles; text changes when someone rewords a label or ships a translation.
Neither is a change in behaviour, so neither should break a test. A contract
attribute exists for this and nothing else.

Where a product has no such attributes, the order of preference is role-based
locators (`getByRole`) first, since they encode accessibility semantics that are
themselves worth asserting, then stable ids — and asking the developers to add
test attributes, which is usually a five-minute conversation.

---

## 5. Page Object Model

Selectors and interactions live in `pages/`, never in the specs. The specs read
as behaviour:

```typescript
await loginPage.login(USERS.standard.username, USERS.standard.password);
await loginPage.expectError(ERRORS.badCredentials);
```

The payoff is maintenance. When the login button's attribute changes, one line
changes in `LoginPage.ts` rather than a line in every spec that logs in. The
cost of a suite is not writing it, it is keeping it alive for two years, and
this is the single decision that most affects that number.

`CheckoutPage` intentionally covers all three checkout steps in one class. They
are never used apart, and splitting them would add ceremony without adding
clarity — the pattern serves the suite, not the other way round.

---

## 6. Flakiness

```typescript
retries: process.env.CI ? 2 : 0
```

Retries are enabled in CI and disabled locally. In CI they stop a transient
network blip against a public demo site from turning a green build red, which
would train the team to ignore the pipeline — the worst possible outcome.

But retries are also the most common way to hide a real bug. **A test that only
passes on the second attempt is a defect to investigate, not a pass.** So they
are made visible rather than swallowed:

- `trace: 'on-first-retry'` captures a full, navigable trace of the failed run.
- The retry count is on the report, so a flaky test can be found and fixed
  rather than quietly tolerated.

Locally retries stay off, because when writing a test you want to see it fail.

**Known risk in this suite:** both targets are free public services. Restful
Booker runs on Heroku and can be slow to wake, and Sauce Demo occasionally
resets. That is an accepted trade-off for a portfolio project; in production the
same suite would run against a controlled environment or a mocked service, and
the weekly scheduled run exists precisely to reveal when an external dependency
has drifted.

---

## 7. Test data

Data lives in `fixtures/`, never inline in a spec. Two reasons: a credential
change touches one file, and the assertions get to reference the same source as
the actions — the tax test computes the expected total from the fixture prices
instead of hardcoding `$32.39`, so it still passes if the catalogue is repriced
and still fails if the arithmetic breaks.

The credentials committed here are the public demo accounts printed on Sauce
Demo's own login page and in Restful Booker's API docs. **In a real project they
would come from environment variables or a secrets store and never be
committed.** The API base URL already reads from `API_BASE_URL` with a fallback,
which is the pattern the rest would follow.

Tests create their own data and never depend on another test's leftovers — the
API specs POST the booking they are about to read, update or delete. That is
what allows the suite to run fully in parallel.

---

## 8. Continuous integration

A test nobody runs is worth nothing. The whole value of automation is that it
executes without anyone remembering to ask.

The pipeline runs on every push and pull request to `main`, and:

- **Splits the four projects into a matrix leg each**, with `fail-fast: false`.
  A Firefox-only failure is a specific and useful signal; cancelling the other
  legs would throw it away.
- **Installs only the browser each leg needs** rather than all three, which is
  most of the runtime on a cold runner.
- **Type-checks before running**, so a broken refactor fails in seconds instead
  of after a full browser suite.
- **Runs weekly on a schedule.** The suite tests live external sites, so it can
  break with no commit involved. The Monday run catches that.
- **Uploads reports with `if: always()`**, so artefacts exist for the failing
  runs — which are the only ones anybody wants to look at.
- **Publishes the Allure report to GitHub Pages**, with history carried over from
  the previous run so trends are visible across builds.

---

## 9. What I would do differently at scale

Honest limitations of this suite, and what would change with a real team and a
real product behind it:

- **Set up state through the API, not the UI.** Every checkout test currently
  logs in through the login form. That is a few extra seconds and one extra
  point of failure per test. A real suite would obtain a session via API and
  inject `storageState`, exercising the login form itself exactly once.
- **Own the environment.** Running against third-party demo sites means accepting
  their downtime as our flakiness. A controlled environment, seeded data, or
  contract-level mocks would remove an entire class of false failures.
- **Add visual regression testing.** Playwright's `toHaveScreenshot` covers the
  layout gap that functional assertions structurally cannot.
- **Add contract testing for the API.** Schema validation of responses catches a
  breaking change the day it ships, rather than when a UI test happens to trip
  over it.
- **Widen to a real device matrix.** Three fixed projects demonstrate the
  mechanism; a production matrix would be driven by actual browser analytics,
  not by what is convenient.
- **Track flakiness as a metric.** Per-test pass rate over time, with a threshold
  that quarantines a test instead of letting the team learn to ignore red.
- **Move credentials to CI secrets** and drop the fixture fallbacks entirely.
