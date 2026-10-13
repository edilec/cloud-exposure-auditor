# Provenance

The implementation is new independent Edilec code using Node standard-library modules. No cloud SDK, runtime/development/optional/peer dependency or vendored upstream module is included. The local catalog's JSON-reader patterns were inspected while planning; the scanner here was independently implemented and no source symbol was copied. MIT license wording is the standard grant used by the Edilec catalog; project copyright is preserved.

Normalized provider semantics are an explicit local v1 profile, derived from the approved Cloud Exposure Auditor design. Operator-supplied normalization/effective states and export authenticity are not authenticated. Synthetic example sources are literal local text; multiple source-kind attestations sharing those synthetic bytes demonstrate format and are not real cloud evidence.

Actual work uses the verified local contributor identity and current Git timestamps. The controller supplied the already created empty `edilec/cloud-exposure-auditor` remote; this repository only sets that local origin. No external code was fetched, no cloud was accessed, no push/package publication/website update occurred.
