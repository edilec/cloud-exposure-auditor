# Local verification receipt

Observed local verification on 2026-10-13T12:45:23.893Z. Version 0.1.0 is local and unpublished. This receipt is excluded by the package whitelist.

## Revisions and authority

- Initial repository was unborn; there is no upstream/base commit. First root commit: `7efd658c7a3cf69bc30b47e4cb3a2cc9e918db9b`.
- Independently reviewed candidate: `5024c57b4d98e39ba58a656f39aedb62c57c2a4e`.
- Author-corrected product revision: `fe212a9b6dc67e79cb97f5c20a7a17a7186a932e`.
- Final tested/distributed candidate (additional validation code, no further product behavior change): `bab74c271fb77b11913ca5c0189d8a2eef7d7de8`.
- This receipt is committed separately; its final commit SHA is reported outside the receipt to avoid a self-reference. The receipt commit must change only `docs/verification.md`.
- Repository: `/Users/km/Dev/edilec-open-source/cloud-exposure-auditor`, normal Git checkout, branch `main`. Local origin: `https://github.com/edilec/cloud-exposure-auditor.git`; configured from the controller-supplied remote, never fetched/pushed in this work.
- Authorized local implementation and truthful current-date commits only. No remote repository creation, cloud access, push, PR, release/tag, package publication, website change, or external message was performed.

Approved policy inputs (SHA-256):

| File | SHA-256 |
| --- | --- |
| `/Users/km/Dev/edilec-open-source/build-plan-2026-09-12/docs/superpowers/specs/2026-10-13-cloud-exposure-auditor-design.md` | `7b707c8f81cb5307616671a2a935b178acd8ced2da4bc3f74e39291b3ab43c93` |
| `/Users/km/Dev/edilec-open-source/build-plan-2026-09-12/docs/superpowers/plans/2026-10-13-cloud-exposure-auditor-implementation.md` | `038fe8d5eec630292a630fd1d21552e3e4dfddb7d8b27e0f2e18f561dd2444ac` |
| `/Users/km/Dev/edilec-open-source/build-plan-2026-09-12/docs/report-contract.md` | `252335c4c2f81125748d3079fb0772f1a42767472148672299d439bc8e900454` |

## Environment and commands

macOS 26.5.2 build 25F84, arm64; bundled Node `v24.19.0`; bundled pnpm `11.25.0`. Node 22 is the declared minimum and was not executed because no installed Node 22 runtime was available. npm was unavailable. No runtime or package-manager download was attempted.

Node executable: `/Users/km/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
pnpm executable: `/Users/km/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm`.

Commands below ran from the tool root using the above executable paths in place of `node`/`pnpm`:

```sh
node scripts/check.mjs
node --import ./test/no-network-preload.mjs --test test/input.test.mjs test/manifest.test.mjs test/azure.test.mjs test/gcp.test.mjs test/integration.test.mjs
node --import ./test/no-network-preload.mjs --test test/mutation.test.mjs
node scripts/mutation-check.mjs
CEA_PNPM=/Users/km/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm node scripts/package-check.mjs
git diff --check
git log --format="%H %aI %cI %an <%ae> %s"
```

The ordinary mutation command ran the original 76-case enumeration during Task 8. After review and receipt inspection, exact selected cases were run through the exported `enumerate`, `runCase`, and `equivalenceProof` helpers with a 60000 ms subprocess ceiling; their baseline selectors passed under the same transport preload. The row table records the exact source edits and selectors. Unchanged earlier results were retained, rather than implying one new 107-case run on the last commit.

| Gate | Observed outcome |
| --- | --- |
| Final syntax/full check on the tested tree | 151 tests, 151 pass, 0 fail/cancelled/skipped/todo; syntax gate passed |
| Added guard-control selection | 82 tests, 82 pass, 0 fail/skipped |
| Runner controls, including comparator domain proof | 2 tests, 2 pass |
| Review corrections | Five new named tests observed RED; focused six-test selection GREEN; subsequent full gate GREEN |
| Original mutation enumeration | 76 ultimately killed; two initial timeouts and three initial runner-errors preserved below |
| Review regression mutations | 4 killed |
| Added planned guard probes | 25 killed |
| Tuple comparator substitutions | 2 survived behavioral selectors and were proved equivalent on admitted finite domains |
| Total mutation disposition | 107 named cases: 105 killed, 2 equivalent, no unresolved timeout/runner-error/non-equivalent survivor |
| Refreshed offline installed package | 94 archive members; all six installed examples and installed ESM library import pass |

All functional inputs are synthetic local fixtures. Dedicated transport denial controls, mutation selectors and package subprocesses install the denial preload before product loading. They deny fetch, HTTP(S), sockets/listeners, TLS, DNS and UDP; controls use invalid/no-transport arguments and never need a valid cloud endpoint. Read-only CLI tests compare before/after SHA-256 snapshots. Fixed parser/OS diagnostics and report fields are checked against private-value/control-character sentinels.

## Package identity

Package manifest SHA-256: `12f4121d165e60d034b0d017a7b5d054c9d27d8a1df1a332964e5c727be295c1`. Runtime, development, optional and peer dependency dictionaries are all empty (omitted in package.json); lifecycle hooks are absent. Standard-library product code only.

```json
{
  "name": "cloud-exposure-auditor",
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "dependencies": {},
  "devDependencies": {},
  "optionalDependencies": {},
  "peerDependencies": {},
  "exports": {
    ".": "./src/index.mjs"
  },
  "bin": {
    "cloud-exposure-auditor": "bin/cloud-exposure-auditor.mjs"
  },
  "files": [
    "bin",
    "src",
    "test",
    "scripts",
    "docs/input-contract.md",
    "docs/provider-profiles.md",
    "docs/rules.md",
    "docs/security-boundaries.md",
    "docs/provenance.md",
    "examples",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ]
}
```

Observed archive SHA-256: `6a93693bcd8bb9e710c1493a1143df8e62948f50aea542cf482bae8bedc77c2f`. The temporary local tarball and installation were removed by the checker; no tarball was published. The checker rejected unsafe/undeclared members and symbolic/hard links, installed only this tarball with `--offline --ignore-scripts --no-lockfile` in an owned temporary store, then compared the installed `.bin` stdout bytes against all six expected reports. Pass fixtures exited 0, exposure fixtures exited 1, stderr empty; installed library returned pass. Tests also pin incomplete exit 2 and invalid-configuration empty stdout.

Archive members in observed listing order:

```text
package/LICENSE
package/examples/aws/fail/expected-report.json
package/examples/aws/pass/expected-report.json
package/examples/azure/fail/expected-report.json
package/examples/azure/pass/expected-report.json
package/examples/gcp/fail/expected-report.json
package/examples/gcp/pass/expected-report.json
package/examples/aws/fail/ingress.json
package/examples/aws/pass/ingress.json
package/examples/azure/fail/ingress.json
package/examples/azure/pass/ingress.json
package/examples/gcp/fail/ingress.json
package/examples/gcp/pass/ingress.json
package/examples/aws/fail/keys.json
package/examples/aws/pass/keys.json
package/examples/azure/fail/keys.json
package/examples/azure/pass/keys.json
package/examples/gcp/fail/keys.json
package/examples/gcp/pass/keys.json
package/examples/aws/fail/logging.json
package/examples/aws/pass/logging.json
package/examples/azure/fail/logging.json
package/examples/azure/pass/logging.json
package/examples/gcp/fail/logging.json
package/examples/gcp/pass/logging.json
package/examples/aws/fail/manifest.json
package/examples/aws/pass/manifest.json
package/examples/azure/fail/manifest.json
package/examples/azure/pass/manifest.json
package/examples/gcp/fail/manifest.json
package/examples/gcp/pass/manifest.json
package/examples/aws/fail/mfa.json
package/examples/aws/pass/mfa.json
package/examples/azure/fail/mfa.json
package/examples/azure/pass/mfa.json
package/examples/gcp/fail/mfa.json
package/examples/gcp/pass/mfa.json
package/package.json
package/examples/aws/fail/storage.json
package/examples/aws/pass/storage.json
package/examples/azure/fail/storage.json
package/examples/azure/pass/storage.json
package/examples/gcp/fail/storage.json
package/examples/gcp/pass/storage.json
package/CHANGELOG.md
package/docs/input-contract.md
package/docs/provenance.md
package/docs/provider-profiles.md
package/README.md
package/docs/rules.md
package/docs/security-boundaries.md
package/test/adversarial.test.mjs
package/src/providers/aws.mjs
package/test/aws.test.mjs
package/src/providers/azure.mjs
package/test/azure.test.mjs
package/src/budget.mjs
package/test/budget.test.mjs
package/scripts/check.mjs
package/src/cli.mjs
package/test/cli.test.mjs
package/bin/cloud-exposure-auditor.mjs
package/src/csv.mjs
package/test/csv.test.mjs
package/src/providers/gcp.mjs
package/test/gcp.test.mjs
package/test/helpers.mjs
package/src/index.mjs
package/src/input.mjs
package/test/input.test.mjs
package/test/integration.test.mjs
package/src/json.mjs
package/test/json.test.mjs
package/scripts/lint.mjs
package/src/manifest.mjs
package/test/manifest.test.mjs
package/scripts/mutation-check.mjs
package/test/mutation.test.mjs
package/test/no-network-preload.mjs
package/test/no-network.test.mjs
package/scripts/package-check.mjs
package/test/package.test.mjs
package/src/provider-common.mjs
package/test/provider-common.test.mjs
package/src/report.mjs
package/test/report.test.mjs
package/src/schema.mjs
package/scripts/write-examples.mjs
package/examples/aws/fail/source.txt
package/examples/aws/pass/source.txt
package/examples/azure/fail/source.txt
package/examples/azure/pass/source.txt
package/examples/gcp/fail/source.txt
package/examples/gcp/pass/source.txt
```

## Independent review and corrections

One fresh-context, read-only whole-repository review examined `5024c57b4d98e39ba58a656f39aedb62c57c2a4e` using gpt-6-astra at high effort. Verdict: With fixes; no Critical finding. There was no second review. The final corrected SHA was verified by author-run tests and packaging, not independently re-reviewed.

| Finding | Effect and disposition | Regression evidence |
| --- | --- | --- |
| AWS deny precedence (Important) | Matching unconditional public whole-bucket denies now suppress the same ACL permission; undenied permission still fails. Fixed. | Unit ACL deny/permission cases plus actual CLI denied-read case RED to GREEN; named mutant killed. |
| Unknown library options (Important) | Misspelled threshold no longer defaults silently; unknown own keys reject ConfigError, CLI forwards library fields only. Fixed. | 60-day key at threshold 30 plus typo/human/undefined cases RED to GREEN; named mutant killed. |
| Non-string provider (reviewer Minor, author Important) | Invalid provider array could be coerced and produce pass on all-CSV evidence. Exact string check added. Fixed. | Five CSV safe baseline then array-provider incomplete/exit 2 RED to GREEN; named mutant killed. |
| CSV header location (reviewer Minor, author Important) | Invalid header was located at EOF instead of its real header line, preventing a usable correction location. Fixed. | Multirow invalid header expected row 1 RED to GREEN; named mutant killed. |

No deferred code minors remain from this review. Regrading and other decisions are recorded below.

| Area reviewer declined to judge | Author disposition and cost if wrong |
| --- | --- |
| Authenticity and completeness of real provider normalization | Remains an explicit operator trust boundary. This tool checks the bounded normalized profile, not raw IAM/cloud truth. A false normalizer may hide exposure; reports disclose authenticity not verified. |
| Live cloud, remote/publication/website behavior | Outside authorized scope; no calls or changes made. Future release/live collection needs separate work and evidence. |
| Node 22 floor | Declared but unverified; only installed Node 24.19.0 executed. Compatibility could differ on Node 22. |
| Hostile concurrent ancestor replacement | Portable Node confinement assumes a private stable tree. A hostile race can exceed that guarantee; docs disclose it. |
| Final broad/package/mutation results | Parent-owned checks measured as above, rather than inferred from reviewer judgment. Enumeration remains named/bounded rather than universally exhaustive. |
| One transient unreadable probe | No reproducible defect or root cause established. Do not claim a diagnosed/fixed read defect; evidence remains subject to stable-tree/runtime assumptions. |

One initial package example run also failed transiently before safe mismatch-count instrumentation was added. A focused repeat and subsequent frozen/refreshed candidate runs passed. No exact transient cause was established; neither the failed run nor a supposed fix is counted as successful evidence.

## Rulings in execution order

| # | Decision | Reason | Cost if wrong / practical limit |
| --- | --- | --- | --- |
| 1 | Use the explicitly authorized independent main repository rather than a new worktree. | The human requested this exact directory and local commits; no other checkout is changed. | If isolation needs change, move future work to a separate branch/worktree. |
| 2 | Allow multiple synthetic source-kind attestations to reference the same local bytes/digest. | The profile verifies consistency, while normalization and authenticity remain operator supplied; contradictory digest is refused. | A false normalizer can still make false facts; no authenticity guarantee is offered. |
| 3 | Define ConfigError once in schema and re-export it. | Avoid circular module initialization while preserving public error identity. | Future callers must keep the same exported class contract. |
| 4 | Evaluate read deadlines with the injected monotonic clock, including timer callbacks. | Exactly N reschedules; only N+1 expires, preserving the approved boundary. | Cooperative checks cannot guarantee hard real-time scheduling. |
| 5 | Use installed pnpm 11.25.0 for offline packaging instead of unavailable npm. | No tooling was downloaded; local pack/offline install proves bin and ESM exports. | npm-specific installation and Node 22 compatibility remain unverified. |
| 6 | Accept only canonical integer JSON numeric lexemes. | All normalized numeric facts are integers; reject exponent/fraction forms that could round or underflow. | Future decimal-valued schemas require explicit expansion; otherwise valid decimal export forms are rejected. |
| 7 | Require actual supported logging region coverage and union separate supported records. | Metadata alone cannot certify absent logging; separate AWS regional trails may jointly cover a bundle. | Incomplete supported normalization can lead to incomplete rather than clean results. |
| 8 | Keep initial mutation timeout and runner-error outcomes separate from assertion kills. | Retry only affected cases; add explicit success assertions around exact-N operations. | Counts describe measured assertions, not every possible fault. |
| 9 | Apply matching unconditional AWS public denies to ACL as well as policy permissions. | A denied read cannot be reported as public; undenied write remains exposure. | The bounded normalized policy model is not full raw IAM evaluation. |
| 10 | Refuse unknown own library configuration keys before defaults. | A misspelled policy option must not silently relax the threshold; CLI presentation options are kept out of the library call. | Callers with previously ignored extra keys now receive ConfigError. |
| 11 | Re-grade non-string provider coercion from reviewer Minor to Important and fix it. | Invalid evidence could produce pass; that changes an operator decision and violates the exact-schema/fail-closed contract. | Array/object provider aliases are rejected rather than coerced. |
| 12 | Re-grade the CSV header location from reviewer Minor to Important and fix it. | A nonexistent source row prevents locating and correcting refused evidence; source provenance is part of the operator contract. | Malformed header diagnostics now point to the actual first header line. |
| 13 | Keep all work and commits local on main. | The human explicitly authorized local commits and prohibited push, PR, publication, hosting, and website changes. | Remote state was not checked; publishing is still separate authorized work. |
| 14 | Complete missing planned mutation families while preparing the receipt. | Added read/open, count/coverage, completeness, semantic and comparator controls without changing product behavior. | Additional local validation time; named enumeration remains bounded. |
| 15 | Treat two tuple-comparator mutants as equivalent only after finite-domain proof. | Actual mutated-copy tests survive; all 10001 allowed roles and 29 rule IDs have byte-identical strict code-unit and English-collation order with no ties. Pointer/body mutants are killed. | The proof must be recomputed if the admitted domains or catalog change. |

## Mutation enumeration

These are named weakening or boundary probes, not a claim that every possible program guard was mutated. Original report/catalog and guard families were exercised during Task 8; review and missing planned-family probes were appended on corrected trees. Source locations refer to the statement that was actually mutated. Temporary copies were removed; source inputs were never modified by the mutation runner.

| # | Name | Source | Original statement | Edited statement | Selector | Final disposition |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | severity:storage-public | src/report.mjs:3 | `  'storage-public': {severity:'error',incomplete:false,` | `  'storage-public': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "storage exposure real exit one" test/integration.test.mjs` | killed |
| 2 | severity:admin-ingress-broad | src/report.mjs:4 | `  'admin-ingress-broad': {severity:'error',incomplete:false,` | `  'admin-ingress-broad': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "ingress exposure real exit one" test/integration.test.mjs` | killed |
| 3 | severity:key-age-exceeded | src/report.mjs:5 | `  'key-age-exceeded': {severity:'error',incomplete:false,` | `  'key-age-exceeded': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "keys exposure real exit one" test/integration.test.mjs` | killed |
| 4 | severity:privileged-mfa-disabled | src/report.mjs:6 | `  'privileged-mfa-disabled': {severity:'error',incomplete:false,` | `  'privileged-mfa-disabled': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "mfa exposure real exit one" test/integration.test.mjs` | killed |
| 5 | severity:audit-logging-disabled | src/report.mjs:7 | `  'audit-logging-disabled': {severity:'error',incomplete:false,` | `  'audit-logging-disabled': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "logging exposure real exit one" test/integration.test.mjs` | killed |
| 6 | severity:input-unreadable | src/report.mjs:8 | `  'input-unreadable': {severity:'warning',incomplete:true,` | `  'input-unreadable': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 7 | incomplete:input-unreadable | src/report.mjs:8 | `  'input-unreadable': {severity:'warning',incomplete:true,` | `  'input-unreadable': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 8 | severity:input-invalid | src/report.mjs:9 | `  'input-invalid': {severity:'warning',incomplete:true,` | `  'input-invalid': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 9 | incomplete:input-invalid | src/report.mjs:9 | `  'input-invalid': {severity:'warning',incomplete:true,` | `  'input-invalid': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 10 | severity:utf8-invalid | src/report.mjs:10 | `  'utf8-invalid': {severity:'warning',incomplete:true,` | `  'utf8-invalid': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 11 | incomplete:utf8-invalid | src/report.mjs:10 | `  'utf8-invalid': {severity:'warning',incomplete:true,` | `  'utf8-invalid': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 12 | severity:duplicate-json-key | src/report.mjs:11 | `  'duplicate-json-key': {severity:'warning',incomplete:true,` | `  'duplicate-json-key': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 13 | incomplete:duplicate-json-key | src/report.mjs:11 | `  'duplicate-json-key': {severity:'warning',incomplete:true,` | `  'duplicate-json-key': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 14 | severity:csv-invalid | src/report.mjs:12 | `  'csv-invalid': {severity:'warning',incomplete:true,` | `  'csv-invalid': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 15 | incomplete:csv-invalid | src/report.mjs:12 | `  'csv-invalid': {severity:'warning',incomplete:true,` | `  'csv-invalid': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 16 | severity:unsupported-provider | src/report.mjs:13 | `  'unsupported-provider': {severity:'warning',incomplete:true,` | `  'unsupported-provider': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 17 | incomplete:unsupported-provider | src/report.mjs:13 | `  'unsupported-provider': {severity:'warning',incomplete:true,` | `  'unsupported-provider': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 18 | severity:unsupported-version | src/report.mjs:14 | `  'unsupported-version': {severity:'warning',incomplete:true,` | `  'unsupported-version': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 19 | incomplete:unsupported-version | src/report.mjs:14 | `  'unsupported-version': {severity:'warning',incomplete:true,` | `  'unsupported-version': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 20 | severity:class-incomplete | src/report.mjs:15 | `  'class-incomplete': {severity:'warning',incomplete:true,` | `  'class-incomplete': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 21 | incomplete:class-incomplete | src/report.mjs:15 | `  'class-incomplete': {severity:'warning',incomplete:true,` | `  'class-incomplete': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 22 | severity:region-incomplete | src/report.mjs:16 | `  'region-incomplete': {severity:'warning',incomplete:true,` | `  'region-incomplete': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 23 | incomplete:region-incomplete | src/report.mjs:16 | `  'region-incomplete': {severity:'warning',incomplete:true,` | `  'region-incomplete': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 24 | severity:pagination-incomplete | src/report.mjs:17 | `  'pagination-incomplete': {severity:'warning',incomplete:true,` | `  'pagination-incomplete': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 25 | incomplete:pagination-incomplete | src/report.mjs:17 | `  'pagination-incomplete': {severity:'warning',incomplete:true,` | `  'pagination-incomplete': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 26 | severity:export-error | src/report.mjs:18 | `  'export-error': {severity:'warning',incomplete:true,` | `  'export-error': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 27 | incomplete:export-error | src/report.mjs:18 | `  'export-error': {severity:'warning',incomplete:true,` | `  'export-error': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 28 | severity:unsupported-field | src/report.mjs:19 | `  'unsupported-field': {severity:'warning',incomplete:true,` | `  'unsupported-field': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 29 | incomplete:unsupported-field | src/report.mjs:19 | `  'unsupported-field': {severity:'warning',incomplete:true,` | `  'unsupported-field': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 30 | severity:source-digest-mismatch | src/report.mjs:20 | `  'source-digest-mismatch': {severity:'warning',incomplete:true,` | `  'source-digest-mismatch': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 31 | incomplete:source-digest-mismatch | src/report.mjs:20 | `  'source-digest-mismatch': {severity:'warning',incomplete:true,` | `  'source-digest-mismatch': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 32 | severity:source-evidence-missing | src/report.mjs:21 | `  'source-evidence-missing': {severity:'warning',incomplete:true,` | `  'source-evidence-missing': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 33 | incomplete:source-evidence-missing | src/report.mjs:21 | `  'source-evidence-missing': {severity:'warning',incomplete:true,` | `  'source-evidence-missing': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 34 | severity:record-count-mismatch | src/report.mjs:22 | `  'record-count-mismatch': {severity:'warning',incomplete:true,` | `  'record-count-mismatch': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 35 | incomplete:record-count-mismatch | src/report.mjs:22 | `  'record-count-mismatch': {severity:'warning',incomplete:true,` | `  'record-count-mismatch': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 36 | severity:record-duplicate | src/report.mjs:23 | `  'record-duplicate': {severity:'warning',incomplete:true,` | `  'record-duplicate': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 37 | incomplete:record-duplicate | src/report.mjs:23 | `  'record-duplicate': {severity:'warning',incomplete:true,` | `  'record-duplicate': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 38 | severity:date-invalid | src/report.mjs:24 | `  'date-invalid': {severity:'warning',incomplete:true,` | `  'date-invalid': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 39 | incomplete:date-invalid | src/report.mjs:24 | `  'date-invalid': {severity:'warning',incomplete:true,` | `  'date-invalid': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 40 | severity:no-evidence | src/report.mjs:25 | `  'no-evidence': {severity:'warning',incomplete:true,` | `  'no-evidence': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 41 | incomplete:no-evidence | src/report.mjs:25 | `  'no-evidence': {severity:'warning',incomplete:true,` | `  'no-evidence': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 42 | severity:byte-limit | src/report.mjs:26 | `  'byte-limit': {severity:'warning',incomplete:true,` | `  'byte-limit': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 43 | incomplete:byte-limit | src/report.mjs:26 | `  'byte-limit': {severity:'warning',incomplete:true,` | `  'byte-limit': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 44 | severity:file-limit | src/report.mjs:27 | `  'file-limit': {severity:'warning',incomplete:true,` | `  'file-limit': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 45 | incomplete:file-limit | src/report.mjs:27 | `  'file-limit': {severity:'warning',incomplete:true,` | `  'file-limit': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 46 | severity:record-limit | src/report.mjs:28 | `  'record-limit': {severity:'warning',incomplete:true,` | `  'record-limit': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 47 | incomplete:record-limit | src/report.mjs:28 | `  'record-limit': {severity:'warning',incomplete:true,` | `  'record-limit': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 48 | severity:depth-limit | src/report.mjs:29 | `  'depth-limit': {severity:'warning',incomplete:true,` | `  'depth-limit': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 49 | incomplete:depth-limit | src/report.mjs:29 | `  'depth-limit': {severity:'warning',incomplete:true,` | `  'depth-limit': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 50 | severity:time-limit | src/report.mjs:30 | `  'time-limit': {severity:'warning',incomplete:true,` | `  'time-limit': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 51 | incomplete:time-limit | src/report.mjs:30 | `  'time-limit': {severity:'warning',incomplete:true,` | `  'time-limit': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 52 | severity:execution-failed | src/report.mjs:31 | `  'execution-failed': {severity:'warning',incomplete:true,` | `  'execution-failed': {severity:'info',incomplete:true,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 53 | incomplete:execution-failed | src/report.mjs:31 | `  'execution-failed': {severity:'warning',incomplete:true,` | `  'execution-failed': {severity:'warning',incomplete:false,` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 54 | deadline-tighten | src/budget.mjs:11 | `current-start>LIMITS.milliseconds` | `current-start>=LIMITS.milliseconds` | `node --import ./test/no-network-preload.mjs --test test/budget.test.mjs` | killed |
| 55 | files-tighten | src/budget.mjs:15 | `files.size>LIMITS.files` | `files.size>=LIMITS.files` | `node --import ./test/no-network-preload.mjs --test test/budget.test.mjs` | killed |
| 56 | records-tighten | src/budget.mjs:16 | `records>LIMITS.records` | `records>=LIMITS.records` | `node --import ./test/no-network-preload.mjs --test test/budget.test.mjs` | killed |
| 57 | bytes-tighten | src/input.mjs:20 | `opened.size>LIMITS.bytes` | `opened.size>=LIMITS.bytes` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 58 | depth-tighten | src/json.mjs:20 | `stack.length>LIMITS.depth` | `stack.length>=LIMITS.depth` | `node --import ./test/no-network-preload.mjs --test test/json.test.mjs` | killed |
| 59 | fatal-decode | src/json.mjs:3 | `{fatal:true}` | `{fatal:false}` | `node --import ./test/no-network-preload.mjs --test test/json.test.mjs` | killed |
| 60 | code-unit-comparator | src/report.mjs:35 | `a < b ? -1 : a > b ? 1 : 0` | `new Intl.Collator('en').compare(a,b)` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 61 | key-age-tighten | src/provider-common.mjs:39 | `nowMs-created>keyAgeDays*86400000` | `nowMs-created>=keyAgeDays*86400000` | `node --import ./test/no-network-preload.mjs --test test/provider-common.test.mjs` | killed |
| 62 | mfa-effective | src/provider-common.mjs:44 | `m.effective===true` | `true` | `node --import ./test/no-network-preload.mjs --test test/provider-common.test.mjs` | killed |
| 63 | aws-future-block-confusion | src/providers/aws.mjs:14 | `policyPublic&&!p.restrictPublicBuckets` | `policyPublic&&!p.blockPublicPolicy` | `node --import ./test/no-network-preload.mjs --test test/aws.test.mjs` | killed |
| 64 | gcp-uniform-iam | src/providers/gcp.mjs:12 | `p.effective!=='enforced'&&(iamPublic\|\|aclPublic)` | `p.effective!=='enforced'&&!row.uniformBucketLevelAccess&&(iamPublic\|\|aclPublic)` | `node --import ./test/no-network-preload.mjs --test test/gcp.test.mjs` | killed |
| 65 | azure-effective-disposition | src/providers/azure.mjs:14 | `row.effective==='applies'&&broad` | `broad` | `node --import ./test/no-network-preload.mjs --test test/azure.test.mjs` | killed |
| 66 | loader-completeness | src/manifest.mjs:11 | `if(klass)incompleteClasses.add(klass);else` | `if(klass)void 0;else` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 67 | deadline-widen | src/budget.mjs:11 | `current-start>LIMITS.milliseconds` | `current-start>LIMITS.milliseconds+1` | `node --import ./test/no-network-preload.mjs --test test/budget.test.mjs` | killed |
| 68 | files-widen | src/budget.mjs:15 | `files.size>LIMITS.files` | `files.size>LIMITS.files+1` | `node --import ./test/no-network-preload.mjs --test test/budget.test.mjs` | killed |
| 69 | records-widen | src/budget.mjs:16 | `records>LIMITS.records` | `records>LIMITS.records+1` | `node --import ./test/no-network-preload.mjs --test test/budget.test.mjs` | killed |
| 70 | depth-widen | src/json.mjs:20 | `stack.length>LIMITS.depth` | `stack.length>LIMITS.depth+1` | `node --import ./test/no-network-preload.mjs --test test/json.test.mjs` | killed |
| 71 | bytes-post-open-widen | src/input.mjs:35 | `total>LIMITS.bytes` | `total>LIMITS.bytes+1` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 72 | real-root-confinement | src/input.mjs:12 | `` if(rel===''\|\|rel==='..'\|\|rel.startsWith(`..${sep}`)\|\|isAbsolute(rel))throw new EvidenceError('input-unreadable',location); `` | `void 0;` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 73 | decoded-duplicate-key | src/json.mjs:17 | `if(top.seen.has(token))` | `if(false)` | `node --import ./test/no-network-preload.mjs --test test/json.test.mjs` | killed |
| 74 | unknown-own-key | src/schema.mjs:8 | `Object.keys(value).length===keys.length&&` | `` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 75 | normalized-digest | src/manifest.mjs:41 | `if(digest!==d.sha256)` | `if(false)` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 76 | mandatory-key-inventory | src/manifest.mjs:31 | `SOURCE_KINDS[provider][klass].some(kind=>!kinds.has(kind))` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 77 | aws-acl-policy-deny | src/providers/aws.mjs:13 | `((acl.publicRead&&!denied.has('read'))\|\|(acl.publicWrite&&!denied.has('write')))` | `(acl.publicRead\|\|acl.publicWrite)` | `node --import ./test/no-network-preload.mjs --test test/aws.test.mjs` | killed |
| 78 | library-unknown-options | src/index.mjs:15 | `Reflect.ownKeys(options).some(key=>!['root','manifestPath','now','keyAgeDays','clock'].includes(key))` | `false` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "policy typos" test/integration.test.mjs` | killed |
| 79 | provider-type-coercion | src/schema.mjs:25 | `typeof raw.provider==='string'&&` | `` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "nonstring provider" test/integration.test.mjs` | killed |
| 80 | csv-header-location | src/csv.mjs:27 | `startLine=headerLine;` | `` | `node --import ./test/no-network-preload.mjs --test test/csv.test.mjs` | killed |
| 81 | lexical-traversal | src/input.mjs:9 | `if(typeof relativePath!=='string'\|\|isAbsolute(relativePath)\|\|relativePath.split(/[\\/]/).includes('..'))throw new EvidenceError('input-unreadable',location);` | `void 0;` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 82 | regular-file-before-open | src/input.mjs:14 | `if(!before.isFile())throw new EvidenceError('input-unreadable',location);` | `void 0;` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 83 | opened-regular-file | src/input.mjs:17 | `!opened.isFile()\|\|` | `` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 84 | opened-file-identity | src/input.mjs:17 | `opened.dev!==before.dev\|\|opened.ino!==before.ino` | `false` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 85 | bytes-pre-open-widen | src/input.mjs:20 | `opened.size>LIMITS.bytes` | `opened.size>LIMITS.bytes+1` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 86 | bytes-post-open-tighten | src/input.mjs:35 | `total>LIMITS.bytes` | `total>=LIMITS.bytes` | `node --import ./test/no-network-preload.mjs --test test/input.test.mjs` | killed |
| 87 | manifest-files-tighten | src/manifest.mjs:17 | `paths.size>LIMITS.files` | `paths.size>=LIMITS.files` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 88 | manifest-files-widen | src/manifest.mjs:17 | `paths.size>LIMITS.files` | `paths.size>LIMITS.files+1` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 89 | raw-source-digest | src/manifest.mjs:37 | `digest!==s.sha256\|\|(sourceHashes.has(key)&&sourceHashes.get(key)!==s.sha256)` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 90 | descriptor-record-count | src/manifest.mjs:47 | `records.length!==c.recordCount` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 91 | total-record-count | src/manifest.mjs:59 | `totals[klass]!==e.expectedRecords` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 92 | descriptor-region-coverage | src/manifest.mjs:30 | `!expectedRegions.includes(r)` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 93 | actual-record-region-coverage | src/manifest.mjs:52 | `!c.regions.includes(row.region)` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 94 | total-region-coverage | src/manifest.mjs:62 | `expected.some(r=>!coverage[klass].has(r))` | `false` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 95 | global-loader-completeness | src/manifest.mjs:11 | `else for(const c of CLASS_IDS)incompleteClasses.add(c);` | `else void 0;` | `node --import ./test/no-network-preload.mjs --test test/manifest.test.mjs` | killed |
| 96 | record-completeness | src/provider-common.mjs:67 | `incomplete=true;findings.push` | `findings.push` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "unsupported provider facts" test/integration.test.mjs` | killed |
| 97 | adapter-completeness | src/provider-common.mjs:73 | `if(r.incomplete)result.incompleteClasses.add(bundle.evidenceClass);` | `void 0;` | `node --import ./test/no-network-preload.mjs --test --test-name-pattern "unsupported provider facts" test/integration.test.mjs` | killed |
| 98 | logging-completeness | src/provider-common.mjs:74 | `result.incompleteClasses.add('logging');` | `void 0;` | `node --import ./test/no-network-preload.mjs --test test/adversarial.test.mjs` | killed |
| 99 | pointer-tuple-comparator | src/report.mjs:47 | `byCodeUnit(a.location.pointer,b.location.pointer)` | `new Intl.Collator('en').compare(a.location.pointer,b.location.pointer)` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | killed |
| 100 | aws-acl-ignore | src/providers/aws.mjs:13 | `!p.ignorePublicAcls&&` | `` | `node --import ./test/no-network-preload.mjs --test test/aws.test.mjs` | killed |
| 101 | aws-deny-permission-matching | src/providers/aws.mjs:12 | `s.permissions.some(permission=>!denied.has(permission))` | `s.permissions.length>0` | `node --import ./test/no-network-preload.mjs --test test/aws.test.mjs` | killed |
| 102 | gcp-effective-pap | src/providers/gcp.mjs:12 | `p.effective!=='enforced'` | `p.configured!=='enforced'` | `node --import ./test/no-network-preload.mjs --test test/gcp.test.mjs` | killed |
| 103 | aws-logging-categories | src/providers/aws.mjs:26 | `!row.enabled\|\|row.managementEvents!=='all'` | `!row.enabled&&row.managementEvents!=='all'` | `node --import ./test/no-network-preload.mjs --test test/aws.test.mjs` | killed |
| 104 | azure-logging-categories | src/providers/azure.mjs:23 | `!row.enabled\|\|!row.categories.administrative\|\|!row.categories.security` | `!row.enabled\|\|(!row.categories.administrative&&!row.categories.security)` | `node --import ./test/no-network-preload.mjs --test test/azure.test.mjs` | killed |
| 105 | gcp-logging-categories | src/providers/gcp.mjs:26 | `!row.enabled\|\|!row.categories.adminActivity\|\|!row.categories.dataAccess` | `!row.enabled\|\|(!row.categories.adminActivity&&!row.categories.dataAccess)` | `node --import ./test/no-network-preload.mjs --test test/gcp.test.mjs` | killed |
| 106 | file-tuple-comparator | src/report.mjs:47 | `byCodeUnit(a.location.file,b.location.file)` | `new Intl.Collator('en').compare(a.location.file,b.location.file)` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | equivalent |
| 107 | rule-tuple-comparator | src/report.mjs:47 | `byCodeUnit(a.ruleId,b.ruleId)` | `new Intl.Collator('en').compare(a.ruleId,b.ruleId)` | `node --import ./test/no-network-preload.mjs --test test/report.test.mjs` | equivalent |

Initial outcomes and affected-case corrections/retries:

```json
[
  {
    "name": "files-tighten",
    "initialOutcome": "runner-error",
    "outcome": "killed",
    "retryReason": "Positive boundary operations now use explicit no-throw/no-rejection assertions."
  },
  {
    "name": "records-tighten",
    "initialOutcome": "runner-error",
    "outcome": "killed",
    "retryReason": "Positive boundary operations now use explicit no-throw/no-rejection assertions."
  },
  {
    "name": "bytes-tighten",
    "initialOutcome": "runner-error",
    "outcome": "killed",
    "retryReason": "Positive boundary operations now use explicit no-throw/no-rejection assertions."
  },
  {
    "name": "deadline-widen",
    "initialOutcome": "timeout",
    "outcome": "killed",
    "retryElapsedMs": 2780
  },
  {
    "name": "files-widen",
    "initialOutcome": "timeout",
    "outcome": "killed",
    "retryElapsedMs": 2832
  }
]
```

The two initial timeout cases passed the same selectors and were killed on a 60000 ms retry (observed 2780/2832 ms); initial timeouts never count as kills. The three runner-error cases were thrown positive-boundary operations, so explicit no-throw/no-rejection assertions made violations report behavioral assertion failures; reruns killed those cases. Syntax/import failures, zero tests, signals, and timeouts are not kills.

Equivalent substitutions:

```json
[
  {
    "name": "file-tuple-comparator",
    "observedOutcome": "survived",
    "proof": {
      "domain": "roles",
      "values": 10001,
      "byteIdenticalOrder": true,
      "noCollationTies": true
    }
  },
  {
    "name": "rule-tuple-comparator",
    "observedOutcome": "survived",
    "proof": {
      "domain": "rules",
      "values": 29,
      "byteIdenticalOrder": true,
      "noCollationTies": true
    }
  }
]
```

## Synthetic input/output fixture hashes

SHA-256 of all 48 committed example files, including manifests, five bundles per fixture, source bytes, and expected stdout. Dynamic adversarial fixtures are generated in owned temporary directories and checked with before/after hashes inside tests; they are removed afterwards. No actual customer/cloud exports are in the repository.

| File | SHA-256 |
| --- | --- |
| `examples/aws/fail/expected-report.json` | `77a5d84cdf7ac9cb93defa61cc110b3e51417d56cff918d1e1ccd4a4f9f95bcb` |
| `examples/aws/fail/ingress.json` | `1956650ffe9abf2f075a8ad22c2e1c318923bef2bcf35e2a76e87e08b5f9f528` |
| `examples/aws/fail/keys.json` | `8f21ffdc25c23e7210e248b9fab3ea86631852e9b6bfc095f68dcaaef0a745cb` |
| `examples/aws/fail/logging.json` | `6ac521739532c74a1b4e0eef8ff4db88e05c30429ceb2c451ff0caaf1f085efb` |
| `examples/aws/fail/manifest.json` | `95daf1809b0b6fe6eeeb5f1b243cba871a5fafbdbc0a313f4f429ff27538410b` |
| `examples/aws/fail/mfa.json` | `2eee267bba0804e82d31e89f35b9edff22fc16b6c8d1733120f6f25ce5a681fb` |
| `examples/aws/fail/source.txt` | `b1ed7a2ea859ae90dcf8a917f5f40bba686a3e891ab667b5d9e82ab0f1c3d5bc` |
| `examples/aws/fail/storage.json` | `384b078fb8496244598062d857520dec750d4b6f918e6a3dfb12a9d337a4c8f2` |
| `examples/aws/pass/expected-report.json` | `90ea9ef81ce02443f56c5ecbd2447d2caa4449860150cdf78489a38ff3b315f8` |
| `examples/aws/pass/ingress.json` | `1c14a04fe0c14f19308b9286ae56c2888dce128367933b40bf64a5a40068efaa` |
| `examples/aws/pass/keys.json` | `4af186f6b08ed86b82743a7add24b30446be0af600aef2196908fef1fbc9a214` |
| `examples/aws/pass/logging.json` | `c36693b68f1c5d8f0ed7db6763004ce07a7005decebc6fdc9b21556273c85858` |
| `examples/aws/pass/manifest.json` | `7125a288c5d3588610d1ad1d37cec3a97b1daaa3b06c3b5dd92ab4eb227cb387` |
| `examples/aws/pass/mfa.json` | `49486942052d22af2a3a89175ba4ad6359aa147a02a38f0b879d4a21ca1e7ad0` |
| `examples/aws/pass/source.txt` | `b1ed7a2ea859ae90dcf8a917f5f40bba686a3e891ab667b5d9e82ab0f1c3d5bc` |
| `examples/aws/pass/storage.json` | `419d89262315337f3f2969ef8cb644c4cec40d39cac18417524d1c7e6417be3c` |
| `examples/azure/fail/expected-report.json` | `bb65b8308a2c0d1c417e0a5aa30880174b9e647ee6232d4c1b9a80a8231b20ef` |
| `examples/azure/fail/ingress.json` | `2c205fe199703e7e6f96bfbdcaf74a6e8ac8e7085252714925ce54f1e44a7039` |
| `examples/azure/fail/keys.json` | `aabb53f7e1d5d57e19f3f002a0875f9f801b0c3a9804b3a4650a25597b939046` |
| `examples/azure/fail/logging.json` | `4d22c6090fd51b2d8cab74e2870d25345c0c202b275f9ebcb7a588ccdaa7625b` |
| `examples/azure/fail/manifest.json` | `8f2f2649b4d17371f47a24aa4dd469c39031bd380d4d84aa8352a7a5c105d8fc` |
| `examples/azure/fail/mfa.json` | `9a42fbbe3ee2eef7f3ba36e2e6f58d264738a5b8a463b1a7a08c3a37f7eaecfe` |
| `examples/azure/fail/source.txt` | `b1ed7a2ea859ae90dcf8a917f5f40bba686a3e891ab667b5d9e82ab0f1c3d5bc` |
| `examples/azure/fail/storage.json` | `f450f3b12d26ded5550c81077c57c3c579ce8dff1f74ff05c84609902da07c44` |
| `examples/azure/pass/expected-report.json` | `90ea9ef81ce02443f56c5ecbd2447d2caa4449860150cdf78489a38ff3b315f8` |
| `examples/azure/pass/ingress.json` | `3768dc1c734b167f0db3cd70ec8e1f82451ef33830688abc2d4aa845eea6dc62` |
| `examples/azure/pass/keys.json` | `ba212711ef09363cfb7fa2fba8e267572dda30201d7966f9745c0229c98194a7` |
| `examples/azure/pass/logging.json` | `652f9afa77373fe48b515a32ec631e2204f7f6e37d4c1e320934c883f4313109` |
| `examples/azure/pass/manifest.json` | `1aee608d369224ecfd67239217ef516428839da0940b057fecc4a94cc3493d23` |
| `examples/azure/pass/mfa.json` | `ff2154b329d2f3a72c63a22f153798ce1e5398e4b085a8c04bc8cce41cbf36cb` |
| `examples/azure/pass/source.txt` | `b1ed7a2ea859ae90dcf8a917f5f40bba686a3e891ab667b5d9e82ab0f1c3d5bc` |
| `examples/azure/pass/storage.json` | `05dcffc85684ca074e80707bfae9c7d12a0891ec26150a40eae9051d1108e40e` |
| `examples/gcp/fail/expected-report.json` | `c5ce5bdf8924316a01cb75497330dd7caa04d82b67e0fea153cd32dc73ad0550` |
| `examples/gcp/fail/ingress.json` | `b12808c637f31f3ab00ce721daa35885883d1de5dc91450c9fc47fcf51e496fe` |
| `examples/gcp/fail/keys.json` | `5738683835f37f31e2deb94034df50d307e6b03b47372037c730c2e18ef03970` |
| `examples/gcp/fail/logging.json` | `5e1ef483a579298227225ce37e1c5b8935273c13e4791135863737c0bb3dd37d` |
| `examples/gcp/fail/manifest.json` | `b6496d1faccd0b545995084393490868a6b69a8dca3ed256b759d208407ae6cc` |
| `examples/gcp/fail/mfa.json` | `6ab0785f4abc4e54ee56edf87cd1e3ced4adccb41a4c2a8745b35ac4855ac8b6` |
| `examples/gcp/fail/source.txt` | `b1ed7a2ea859ae90dcf8a917f5f40bba686a3e891ab667b5d9e82ab0f1c3d5bc` |
| `examples/gcp/fail/storage.json` | `35728a4867514907516b438d186c31cf43514605315cccd933679f64f487a86b` |
| `examples/gcp/pass/expected-report.json` | `90ea9ef81ce02443f56c5ecbd2447d2caa4449860150cdf78489a38ff3b315f8` |
| `examples/gcp/pass/ingress.json` | `e6a172e29013855b603b7a11f59208cc6aa4bb4644516ef2a5dae5a33c7630ed` |
| `examples/gcp/pass/keys.json` | `667111e9e0c9d001f90e0bf05cf75653476a84e91c9c73aab2d37d142dc523f0` |
| `examples/gcp/pass/logging.json` | `c47a34ffeac6b00cf1d47510171efa0c5d2949ed20b4992827cd6beebf3a734e` |
| `examples/gcp/pass/manifest.json` | `157221b679aac1afad0fb03911d581489defda9bfb442aa174e1f2d03b104b8d` |
| `examples/gcp/pass/mfa.json` | `9b0e296b0dc2fa4ec1a317755fab196ffce59c461a83c2aae65421eb362078a5` |
| `examples/gcp/pass/source.txt` | `b1ed7a2ea859ae90dcf8a917f5f40bba686a3e891ab667b5d9e82ab0f1c3d5bc` |
| `examples/gcp/pass/storage.json` | `57f211d6b3bbea0abbbb8316dca20c11ae271e3ebcab90d00b045525563d05d5` |

## Mirrored execution ledger

The owned scratch ledger is preserved here before its cleanup. Entries are chronological; later complete/final entries supersede earlier in-progress entries.

```text
# SDD ledger — plan: /Users/km/Dev/edilec-open-source/build-plan-2026-09-12/docs/superpowers/plans/2026-10-13-cloud-exposure-auditor-implementation.md

Authorization: human explicitly requested local implementation on 2026-10-13 without another plan-review pause. Exact independent directory and local main commits authorized. Controller verified empty public remote; local origin configured. Push/publication/website forbidden.

Pre-flight Task 1→2→3: one EvidenceError and run-wide budget; parser counts records only in loader. Consistent.
Pre-flight Task 3→4/5/6→7: Loaded carries incompleteClasses Set; union with adapter incompleteClasses. Plan corrected before implementation.
Pre-flight Task 4→5/6: common network/age/MFA helpers, exact provider enums. Plan corrected GCP unsupported conditions to reject private-endpoint shorthand.
Pre-flight Task 7→8/9: real-bin runner, offline preload, examples use real digests. Consistent.
Ruling: work in the explicitly requested independent main repository — authorized exact-directory initialization supersedes optional worktree setup — no unrelated checkout is changed.
Ruling: a raw synthetic source may attest multiple source kinds with the same digest — v1 verifies bytes, not authenticity; contradictory digest is still refused — false normalization remains an operator trust boundary.
Task 1: in progress; base unborn.
Task 1: complete — 11/11 named report/budget tests passed; commit recorded in local Git.
Task 2: in progress.
Task 2: complete — 12/12 named parser/read tests passed, RED missing modules → GREEN; independent scanner implementation, no copied source.
Task 3: in progress.
Task 3: complete — 23/23 manifest tests passed including actual 100/101 files and 100000/100001 records; RED missing loader → GREEN.
Task 4: in progress.
Task 4: complete — 16/16 common/AWS tests passed. Zone-qualified IPv6 exposed an isIP acceptance assumption; explicit zone refusal fixed the named RED test.
Task 5: in progress.
Task 5: complete — 11/11 Azure tests passed RED missing adapter → GREEN.
Task 6: in progress.
Task 6: complete — 12/12 GCP tests passed RED missing adapter → GREEN.
Task 7: in progress.
Task 7: complete — full lint/test check 115/115 passed, no skips. Real-bin 0/1/2 streams, all providers and CSV, injected deadline.
Ruling: ConfigError is defined once in schema and re-exported from CLI/library — avoids a circular module dependency while preserving public class identity.
Ruling: read timeout checks the injected clock on its callback — at exactly N it reschedules rather than asserting expiration using real timer elapsed time.
Ruling: use bundled pnpm 11.25.0 for offline package/install verification — npm is absent, pnpm is already installed and supports offline local artifacts; no downloaded tooling.
Task 8: in progress.
Task 8: complete — 17/17 focused adversarial/read/offline/runner tests passed; 76/76 enumerated mutations killed after two timeouts were rerun and three positive boundary failures gained explicit assertion wrappers.
Ruling: reject fractional/exponent JSON numeric lexemes — all normalized numeric facts are integers; this prevents underflow/rounding manufacturing usable evidence — decimal-valued extensions need a later explicit schema.
Ruling: logging requires actual supported region coverage and combines separate regional records — fixes false rejection and prevents empty declarations certifying missing log settings.
Ruling: mutation receipts preserve two initial timeout outcomes and three initial runner-error outcomes; neither counted as a kill. Retried exact failed cases only.
Task 9: in progress — source examples and offline pnpm pack/install have passed once; final candidate checks/review remain.
Final review: one independent read-only reviewer examined candidate 5024c57b4d98e39ba58a656f39aedb62c57c2a4e; verdict With fixes, no Critical finding. No second review is planned.
Ruling: fix matching AWS public deny precedence for ACL permissions — known denied read must not produce a false exposure; undenied write remains detectable.
Ruling: reject unknown own library option keys before applying defaults — misspelled policy options must not silently loosen the threshold; CLI forwards only library options.
Ruling: treat the reviewer-minor non-string provider coercion as a required exact-schema correction — invalid evidence producing pass violates fail-closed behavior, so correct it in this pass.
Ruling: correct the reviewer-minor CSV header location in this pass — a nonexistent source row violates the required usable provenance contract, rather than being cosmetic formatting.
Review corrections: five new named regression tests failed before implementation, then the six-test focused selection including the existing human-summary case passed. Full corrected lint/test gate passed 144/144, zero skips, cancellations or failures.
Mutation evidence: the original 76 named checks plus four newly added review-regression checks were killed; the four new cases ran after the corrections. Original unaffected cases were not redundantly rerun. This is a bounded enumeration, not proof that every possible schema/semantic guard has been mutated.
Review scope dispositions: raw IAM/provider normalization authenticity and hostile concurrent ancestor replacement remain documented boundaries; live/cloud/remote/publication/hosting actions remain outside authorization; minimum Node 22 execution remains unverified. One transient unreadable probe did not establish a reproducible defect.
Finishing ruling: preserve this normal local main repository and commits as already authorized; no integration menu, remote operation, pull request, or worktree removal is needed.
Validation ruling: the receipt audit exposed missing named probes from Task 8's required families — add read/open identity, coverage/count, completeness and provider-semantic probes plus necessary controls, with no product behavior change; cost if wrong is extra local validation time.
Validation controls: 82/82 focused input/manifest/provider/integration tests and 2/2 runner control tests pass. Twenty-five added guard probes were killed. Earlier unchanged probe results are retained rather than remeasured.
Comparator ruling: substitutions for the file and rule tuple terms survive because their permitted finite domains have identical code-unit and English-collation order — record equivalent only after an actual mutated-copy run and a strict no-ties, byte-identical ordering proof over all 10001 allowed roles and 29 catalog IDs; pointer/body substitutions are killed. Cost if the domain changes is that this proof must be recomputed.
Task 9: complete — tested candidate bab74c271fb77b11913ca5c0189d8a2eef7d7de8; final syntax/full gate 151/151, no failures/skips; cumulative enumeration 107: 105 killed, 2 equivalent with finite-domain proof, none unresolved; refreshed offline pnpm package archive 94 members, six installed examples and library import pass. Archive SHA-256 6a93693bcd8bb9e710c1493a1143df8e62948f50aea542cf482bae8bedc77c2f. Receipt-only commit remains before final handoff.
```

## Git provenance and final limits

Local candidate contains 95 tracked files and 1554 inserted lines from an empty tree. Author and committer dates/identities below were read from actual Git; fixture dates are independent of commit dates.

```text
7efd658c7a3cf69bc30b47e4cb3a2cc9e918db9b | 2026-10-13T16:52:50+05:30 | 2026-10-13T16:52:50+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: define exposure reports and bounded evaluation
5692506bea200b7a0c2c5a479f6aca60be841962 | 2026-10-13T16:55:59+05:30 | 2026-10-13T16:55:59+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: parse confined offline export evidence
787e5607b9d92e1ba2104e7101a2b5459f9c6a6e | 2026-10-13T16:59:44+05:30 | 2026-10-13T16:59:44+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: validate export coverage and source integrity
c481e1e51c3886dc11662ab35b3c3fad29434331 | 2026-10-13T17:01:56+05:30 | 2026-10-13T17:01:56+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: audit supported AWS exposure facts
fd8765b6f5d091eae25fbe02e8d09e21aa11e95e | 2026-10-13T17:03:11+05:30 | 2026-10-13T17:03:11+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: audit supported Azure exposure facts
f7343f3a3d7cfa342d37ce8b3294711f0dc1c762 | 2026-10-13T17:05:17+05:30 | 2026-10-13T17:05:17+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: audit supported GCP exposure facts
0b7b06f88f2c6b3c09c4cb38ec6f895feb6c8176 | 2026-10-13T17:09:59+05:30 | 2026-10-13T17:09:59+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | feat: expose deterministic offline exposure audit CLI
1483e347657648373db72536036562725d1e3a0f | 2026-10-13T17:46:57+05:30 | 2026-10-13T17:46:57+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | test: pin offline exposure security boundaries
5024c57b4d98e39ba58a656f39aedb62c57c2a4e | 2026-10-13T17:46:57+05:30 | 2026-10-13T17:46:57+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | docs: document and package offline exposure auditor
fe212a9b6dc67e79cb97f5c20a7a17a7186a932e | 2026-10-13T18:03:14+05:30 | 2026-10-13T18:03:14+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | fix: enforce exact exposure evidence contracts
bab74c271fb77b11913ca5c0189d8a2eef7d7de8 | 2026-10-13T18:11:53+05:30 | 2026-10-13T18:11:53+05:30 | Krishnam Murarka <83580811+KRISHNAMMurarka@users.noreply.github.com> | test: complete planned exposure guard probes
```

Read the input contract, provider profiles and security boundaries before supplying exports. Pass certifies only the five supported checks against supplied complete normalized evidence; it does not certify account security, authentic cloud exports, full provider IAM/policy semantics, or compliance. Unsupported evidence remains incomplete. No publication readiness claim is made for the untested Node 22 minimum or npm-specific packaging.
