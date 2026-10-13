# Cloud Exposure Auditor

Audit five exposure classes in local normalized AWS, Azure, or GCP exports: public storage, broad inbound administrative access, active long-lived key age, privileged MFA, and required audit logging. Node 22+ ESM, zero dependencies, offline and read-only.

Export and normalize evidence yourself from scopes you are authorized to inspect. This tool accepts the documented versioned bundles; it never logs in to a cloud, calls an API, runs an export command, changes a resource, or writes a report file.

```sh
node bin/cloud-exposure-auditor.mjs --root examples/aws/pass --manifest manifest.json --now 2026-10-13T00:00:00Z
node bin/cloud-exposure-auditor.mjs --root examples/aws/fail --manifest manifest.json --now 2026-10-13T00:00:00Z --human
node scripts/check.mjs
```

Replace `aws` with `azure` or `gcp` for their synthetic pass/fail examples. Pass examples exit 0; fail examples intentionally exit 1 and exercise all five exposure rules. Dates are injected fixture dates, not claims of real cloud collection. Use the actual evidence/evaluation date for real runs.

## Interface

`--root DIR --manifest RELATIVE_FILE --now UTC_INSTANT` are required. `--key-age-days INTEGER` defaults to 90 (range 1–36500). `--human` adds a fixed human summary on stderr. `--help` prints static usage. No output-file, login, remediation, limit override, or live adapter option exists.

Stdout contains one catalog-v1 JSON report and a newline; normal diagnostics never contain input values. Complete supported evidence passes at exit 0, known exposure in complete evidence fails at exit 1, and incomplete evidence exits 2 even when exposure is also known. Invalid usage/configuration exits 2 with **empty stdout** and fixed stderr. An unreadable/malformed evidence subject exits 2 with **incomplete JSON**. Missing/partial evidence, pagination, region gaps, unsupported states, source mismatches, and zero checked records cannot pass.

Findings use logical `@manifest` and `@bundle-0001` roles in manifest descriptor order, with JSON pointers or physical CSV `row:N/field` locations. Look up the actual local file in the invoked manifest. Private paths, account/principal/key/bucket names, hostnames, digests and input excerpts are never printed. Findings sort by UTF-16 code-unit `(file,pointer,ruleId)` and repeated identical invocations emit identical bytes.

Coverage and normalization are operator supplied. SHA-256 verifies only supplied local bytes against supplied digests; export authenticity is unverified. Pass means only that supplied complete evidence satisfied these supported rules; account security and export authenticity are not certified.

## Input and rules

Read [the input contract](docs/input-contract.md), [provider profiles](docs/provider-profiles.md), [full rule table](docs/rules.md), and [security boundaries](docs/security-boundaries.md). Normalized JSON/CSV bundles include source descriptions/digests, exact record counts, pagination status and region coverage. AWS credential reports require a separate key inventory to support complete key evidence. Unknown provider policy conditions, NSG/firewall applicability, inherited enforcement and log exclusions remain incomplete rather than guessed.

| Exposure rule | Severity | Supported observation |
| --- | --- | --- |
| `storage-public` | error | Public storage access remains effectively permitted |
| `admin-ingress-broad` | error | TCP 22/3389/5985/5986 accessible from IPv4 prefix ≤8 or IPv6 ≤32 |
| `key-age-exceeded` | error | Active long-lived key is strictly older than the injected day threshold |
| `privileged-mfa-disabled` | error | Privileged identity has known effective MFA disabled |
| `audit-logging-disabled` | error | A required supported audit category is disabled |

Limits: 8388608 bytes (8 MiB) per opened input, 100 total input files, 100000 total top-level evidence records, JSON container depth 16, and 10000 ms (ten seconds) of injected monotonic evaluation time. Exactly N is accepted, N+1 incomplete. Deadline checks are cooperative around synchronous work, not hard real-time scheduling. Input trees must be private/stable during the run; portable Node cannot guarantee confinement against hostile concurrent ancestor replacement.

## Library and local distribution

```js
import {auditExports,TOOL_ID,LIMITS,RULE_SEVERITY} from 'cloud-exposure-auditor';
const report=await auditExports({root:'exports',manifestPath:'manifest.json',
  now:'2026-10-13T00:00:00Z',keyAgeDays:90});
```

`auditExports` returns an incomplete report for evidence failures and rejects with `ConfigError` for invalid caller configuration. It reads only the explicit root-confined input set. An injected `clock` function supports deterministic deadline testing. No ambient wall-clock date influences the findings.

`lint`, `test`, `check` package scripts are equivalent to `node scripts/lint.mjs`, `node --test`, and `node scripts/check.mjs`; no install is required to run the repository. Release checks use `node scripts/mutation-check.mjs` and `node scripts/package-check.mjs`. The latter needs an already installed pnpm (`CEA_PNPM` may name it), packs locally and installs the local tarball offline with scripts disabled into a disposable directory. It does not publish or download tooling. The local checkout's `docs/verification.md` records the actual runtime and measured results and is excluded from the distribution; a declared runtime floor is distinct from a tested version.

No live cloud access, key material export, automatic remediation, account-wide security certification, compliance attestation, telemetry or claims about unrepresented resources. Version 0.1.0 is local and unpublished.
