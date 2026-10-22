# Required CI quality gate

`CI / Quality gate` runs on every pull request targeting `main`, pushes to `main`, manual dispatches and merge-queue groups. There are no path filters or job-level conditions that could skip the required job.

The job installs the committed lockfile with Node 24/npm 11, then runs:

1. `npm run verify`: strict types, ESLint, formatting, all Vitest tests, puzzle-data validation and production build.
2. `env -u PWDEBUG -u HEADED npm run test:e2e`: every Playwright test in headless desktop/mobile Chromium, zero retries.

Any failed command fails the job. Failed browser runs retain their HTML report, screenshots and traces for 7 days. An absent or empty test suite is not treated as passing. Public CI has no private book pack and validates the attributed CC0 dataset.

## Merge protection

`main` requires the check named **Quality gate**, provided by the GitHub Actions app. The source branch must be up to date with `main`. Protection applies to administrators; direct updates require a PR, but no additional reviewer approval is required. Force pushes and branch deletion are disabled.

Workflow YAML alone cannot block merges: GitHub branch protection must require the check. The required check's name must remain unique and must be updated in the protection rule if the job is renamed. A missing, pending, failed or cancelled check blocks merging.

## First publication

Publish the `ci/required-quality-gate` branch and open its PR against `main`. The workflow will run on that PR. Wait for **Quality gate** to succeed, then merge using a merge commit. GitHub execution is unverified until that first run completes.

Existing stacked feature branches predate CI. When GitHub reports that a PR is behind `main`, update that feature branch from `main` and wait for CI to pass again. Do not bypass protection to merge a failing or untested change.

## Deployment

This workflow grants read-only repository permissions and does not publish the site. The separate Pages workflow on the deployment branch can be reviewed later. It must not reuse the required job name or deploy from pull requests. Deployment failures and test failures are separate concerns; passing tests remain mandatory before merging.

GitHub references: [required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging), [branch-protection API](https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection).
