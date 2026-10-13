# Supported normalized provider profiles v1

These are operator-produced normalized bundles, not arbitrary raw provider exports or Terraform. The auditor validates these facts and their local consistency; it cannot prove the normalizer collected or interpreted the provider correctly. Unsupported conditions, identities, coverage or effective states are incomplete, never account-wide assurance.

Every record has an opaque `id` and `region`. Refer to the runnable examples for complete field shapes; JSON object keys and enum values are exact. CSV uses the same field names with JSON cells for arrays/objects.

## AWS

Storage source kind: `storage-public-policy`. Fields: `policy:{state,statements}`, `acl:{publicRead,publicWrite}`, `publicAccessBlock:{blockPublicAcls,ignorePublicAcls,blockPublicPolicy,restrictPublicBuckets}`, `ownership`. Policy states absent/present; unsupported is incomplete. Statements have `effect` allow/deny, `principal` public/restricted, nonempty unique `permissions` read/write, `resourceScope` whole-bucket, and `condition` none/private-endpoint. Private-endpoint is an operator-normalized assertion, not raw IAM interpretation. Conditional denies and arbitrary resource scopes are unsupported. Unconditional public denies cover only their matching permissions. Ignore ACLs only when effectively ignored or bucket-owner-enforced. Blocking future policies/ACLs does not erase existing public grants.

Ingress source `ec2-security-groups`: protocol tcp/udp/all, fromPort/toPort (null for all), cidrs, enabled. Ingress entries are grants. Keys sources **both** `iam-credential-report` and `access-key-inventory`: principalKind user/root, credentialType access-key, createdAt, active. A credential report alone is insufficient. No key material field is accepted.

MFA source `mfa-state`: principalKind user/root/federated, privileged, mfa status enabled/disabled, basis direct/federated, effective true. Unknown enrollment/enforcement is incomplete; federated basis must match identity kind. Logging source `cloudtrail-status`: enabled, managementEvents all/read-only/write-only/none, coverageRegions, exclusions none. Required local profile is enabled management read+write evidence covering all declared regions. Unsupported exclusions and unresolved organization/multiregion coverage are incomplete.

## Shared network and age policy

Administrative TCP ports: 22, 3389, 5985, 5986. Broad means IPv4 prefix at most 8 or IPv6 at most 32; /0 is unrestricted. IPv4-mapped IPv6 is interpreted consistently with IPv4 to avoid prefix bypass. CIDRs require valid canonical networks (zero host bits); no zone IDs, hostnames or unresolved service tags. A more specific range is clean only for this supported rule. Active long-lived keys fail only when elapsed age is strictly greater than the injected day threshold. Invalid/future UTC dates remain incomplete even on inactive keys.
