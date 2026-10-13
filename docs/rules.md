# Rule catalog v1

All incomplete rules are warning findings with explicit incomplete semantics; known exposure errors fail only with complete evidence. Severity is fixed by this catalog; identifiers are stable across releases.

| Rule ID | Severity | Observation | Action |
| --- | --- | --- | --- |
| `storage-public` | error | Supported evidence permits public storage access. | Remove public grants or enforce the applicable public-access restriction. |
| `admin-ingress-broad` | error | Supported evidence permits broad inbound administrative access. | Restrict sources and require a controlled administrative access path. |
| `key-age-exceeded` | error | An active long-lived key exceeds the configured age threshold. | Rotate the key through the authorized credential workflow. |
| `privileged-mfa-disabled` | error | A privileged identity has effective MFA disabled. | Enforce MFA through the supported identity policy. |
| `audit-logging-disabled` | error | A required audit-logging category is disabled. | Enable the documented required audit categories. |
| `input-unreadable` | warning | A declared input could not be read safely. | Check the declared file and root confinement locally. |
| `input-invalid` | warning | A declared input does not satisfy its documented format. | Correct the located input using the v1 schema. |
| `utf8-invalid` | warning | A structured input is not valid UTF-8. | Export structured evidence as valid UTF-8. |
| `duplicate-json-key` | warning | A structured input has a duplicate decoded object key. | Remove the ambiguous duplicate key. |
| `csv-invalid` | warning | A CSV input has an invalid header or record. | Correct the located row using the CSV profile. |
| `unsupported-provider` | warning | The declared provider is unsupported. | Supply an AWS, Azure, or GCP v1 bundle. |
| `unsupported-version` | warning | An input schema version is unsupported. | Supply the documented v1 schema. |
| `class-incomplete` | warning | A required evidence class is absent or partial. | Supply complete evidence for the located class. |
| `region-incomplete` | warning | Declared and observed region coverage is inconsistent. | Export every declared region and correct coverage metadata. |
| `pagination-incomplete` | warning | A bundle retains incomplete pagination evidence. | Export all pages before declaring completion. |
| `export-error` | warning | Export metadata records a collection error. | Resolve the export error and collect evidence again. |
| `unsupported-field` | warning | A provider fact or effective state is unsupported or unknown. | Supply a supported fact or keep this class incomplete. |
| `source-digest-mismatch` | warning | Declared source bytes do not match their digest. | Rebuild the local bundle and its source digests consistently. |
| `source-evidence-missing` | warning | A required source evidence kind is missing. | Include the required export sources for this class. |
| `record-count-mismatch` | warning | Actual and declared record counts differ. | Reconcile complete records with the coverage counts. |
| `record-duplicate` | warning | A normalized record identity occurs more than once. | Resolve duplicate evidence without discarding coverage. |
| `date-invalid` | warning | An evidence date is invalid or later than the evaluation date. | Supply valid UTC evidence and evaluation dates. |
| `no-evidence` | warning | No supported evidence record was checked. | Supply supported records for the declared scope. |
| `byte-limit` | warning | An input exceeds the 8388608-byte limit. | Split the export within byte and total-file bounds. |
| `file-limit` | warning | The input set exceeds the 100-file limit. | Reduce the file set while retaining complete coverage. |
| `record-limit` | warning | The evidence exceeds the 100000-record limit. | Split the audit scope without claiming unexamined coverage. |
| `depth-limit` | warning | Evidence exceeds JSON container depth 16. | Flatten normalized evidence to the supported depth. |
| `time-limit` | warning | Evaluation exceeds the 10000-millisecond deadline. | Reduce the audit scope and rerun with complete evidence. |
| `execution-failed` | warning | Evaluation could not complete. | Inspect local inputs and runtime, then rerun the explicit scope. |
