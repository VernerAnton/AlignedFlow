// Bump by one whenever work ships. Hand-maintained on purpose: a version
// should mark a change worth noticing, not every commit — and keeping it in
// its own file makes the bump a one-line diff that's obvious in review.
//
// Counts builds shipped since this counter was added, not the app's age, so
// it is not the semver in package.json and never will be.
export const APP_VERSION = 3;
