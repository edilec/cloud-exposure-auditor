# Local input contract v1

Supply one manifest under a declared real root. All normalized and digest-source paths must resolve to regular files inside that root. Lexical traversal and absolute evidence paths are refused. Input trees must remain stable during evaluation; portable Node checks cannot guarantee race-free ancestor confinement against a hostile process.

The manifest has exactly `schemaVersion`, `provider`, `accountAlias`, `exportedAt`, `regions`, `evidence`, `files`. Version is `1`; provider is `aws`, `azure`, or `gcp`. Export/evaluation dates are real UTC instants `YYYY-MM-DDTHH:mm:ss[.sss]Z`; export dates cannot exceed the injected evaluation date. Regional names are unique and exclude the reserved `global` role.

Five evidence keys: `storage`, `ingress`, `keys`, `mfa`, `logging`. Each declares `{status:'complete'|'partial'|'absent',expectedRecords:nonnegativeSafeInteger,emptyVerified:boolean}`. A missing/partial/absent class is incomplete. Zero rows requires explicit empty verification; an entirely empty run never passes.

Each file descriptor contains exactly `path`, `format` (`json` or `csv`), `schemaVersion`, `evidenceClass`, lowercase 64-hex `sha256`, `source:{kind:'description'|'command',text}`, `sourceFiles:[{path,sha256,kind}]`, and `coverage:{regions,recordCount,paginationComplete,continuation,exportErrors,unsupportedFields}`. Source descriptions/commands are inert data and are never executed or printed. SHA-256 verifies supplied local bytes, not cloud authenticity or normalization truth. Provider-specific mandatory source kinds appear in the provider profiles. AWS keys require both a credential report and a separate key inventory.

JSON bundles have exactly `{schemaVersion:'1',provider,evidenceClass,records:[...]}`. Records have `id`, `region` and provider-specific fields. Keys/MFA are global; regional classes must cover every declared region. Counts, continuation, export errors and unsupported facts cannot be silenced by a manifest assertion.

CSV uses the exact record field names as unique headers. Nested arrays/objects are JSON inside quoted cells; booleans are literal `true` or `false`; integers are canonical nonnegative decimal digits (nullable ports use `null`). LF/CRLF, escaped quotes, quoted commas/newlines and no final newline are supported. Findings use `row:N/field`, the physical starting line including multiline cells. JSON pointers address the exact normalized JSON record.

Strict UTF-8 decoding, duplicate decoded JSON key refusal, exact object keys and field types apply. Numeric facts use safe integer decimal JSON literals; fractional/exponent forms are refused before rounding can manufacture integer evidence. Unknown or visually unusable fields are incomplete. Aliases/IDs are nonblank 1–256 UTF-16 units; regions 1–64; source descriptions/paths at most 1024. C0, DEL, C1, separators and format/bidi controls make identifiers unusable. Private values are never rendered.

Limits are 8388608 bytes per input, 100 unique input files including manifest/digest sources, 100000 top-level normalized records across the run, JSON container depth 16 (root container is 1), and 10000 ms of injected monotonic evaluation time. Exactly N is accepted; N+1 incomplete. Reads are bounded after opening, and parsing checks depth before materialization. Deadline checks are cooperative around synchronous operations, not OS real-time preemption. No CLI limit override exists.

Reports use `@manifest` and `@bundle-0001` onwards in manifest descriptor order as logical provenance. The manifest maps those roles to actual local files. Private file paths, identifiers and digests remain in inputs, never stdout/stderr. Reports declare coverage and normalization operator supplied and authenticity unverified.
