# IWW Dependency Reproducibility Requirement

The current branch must not be considered production-reproducible while direct dependencies use floating versions such as `latest` or while the repository lacks an npm lockfile.

This is a release-engineering gate, not an application-runtime feature.

## Required final state

Before production release:

1. Generate the npm lockfile from a trusted networked environment using the exact `package.json` committed for release.
2. Review the resolved direct dependency versions and replace floating direct specifiers (`latest`, `*`, unbounded ranges) with deliberate version constraints or exact versions consistent with the team's update policy.
3. Commit `package-lock.json`.
4. Change production CI/deployment install steps to `npm ci`.
5. Run the complete production test/build suite from a clean checkout with an empty `node_modules` directory.
6. Run dependency/security review using the organization's approved tooling and resolve or explicitly risk-accept applicable findings.
7. Save the release commit, lockfile hash, Node/npm versions, test output, and build/deployment identifiers as release evidence.

## Why this remains blocked

Without a committed lockfile, transitive dependency resolution can change while the application source commit remains identical. Floating direct versions increase that variability further.

A successful build today therefore proves that one dependency resolution built successfully; it does not prove that the same source commit will resolve identically later.

## Update workflow after launch

Dependency upgrades should be explicit changes:

1. update the intended package/version;
2. regenerate the lockfile;
3. review the dependency diff;
4. run production tests/build/security checks;
5. deploy through the normal evidence-gated process.

Do not silently switch production back to `npm install` because `npm ci` exposes an out-of-date lockfile. Fix the dependency declaration/lockfile mismatch instead.

## Current release treatment

Until the final state above exists:

- CI/deployment reproducibility remains **not verified**;
- provider build success may be used as build evidence, but not as deterministic dependency evidence;
- the release evidence index and PR must continue to show this as unresolved work.
