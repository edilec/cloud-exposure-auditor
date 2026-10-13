# Supported normalized provider profiles v1

These are operator-produced normalized bundles, not arbitrary raw provider exports or Terraform. The auditor validates these facts and their local consistency; it cannot prove the normalizer collected or interpreted the provider correctly. Unsupported conditions, identities, coverage or effective states are incomplete, never account-wide assurance.

Every record has an opaque `id` and `region`. Refer to the runnable examples for complete field shapes; JSON object keys and enum values are exact. CSV uses the same field names with JSON cells for arrays/objects.

## AWS

Storage source kind: `storage-public-policy`. Fields: `policy:{state,statements}`, `acl:{publicRead,publicWrite}`, `publicAccessBlock:{blockPublicAcls,ignorePublicAcls,blockPublicPolicy,restrictPublicBuckets}`, `ownership`. Policy states absent/present; unsupported is incomplete. Statements have `effect` allow/deny, `principal` public/restricted, nonempty unique `permissions` read/write, `resourceScope` whole-bucket, and `condition` none/private-endpoint. Private-endpoint is an operator-normalized assertion, not raw IAM interpretation. Conditional denies and arbitrary resource scopes are unsupported. Unconditional public denies cover only their matching permissions. Ignore ACLs only when effectively ignored or bucket-owner-enforced. Blocking future policies/ACLs does not erase existing public grants.

Ingress source `ec2-security-groups`: protocol tcp/udp/all, fromPort/toPort (null for all), cidrs, enabled. Ingress entries are grants. Keys sources **both** `iam-credential-report` and `access-key-inventory`: principalKind user/root, credentialType access-key, createdAt, active. A credential report alone is insufficient. No key material field is accepted.

MFA source `mfa-state`: principalKind user/root/federated, privileged, mfa status enabled/disabled, basis direct/federated, effective true. Unknown enrollment/enforcement is incomplete; federated basis must match identity kind. Logging source `cloudtrail-status`: enabled, managementEvents all/read-only/write-only/none, coverageRegions, exclusions none. Required local profile is enabled management read+write evidence covering all declared regions. Unsupported exclusions and unresolved organization/multiregion coverage are incomplete.

## Shared network and age policy

Administrative TCP ports: 22, 3389, 5985, 5986. Broad means IPv4 prefix at most 8 or IPv6 at most 32; /0 is unrestricted. IPv4-mapped IPv6 is interpreted consistently with IPv4 to avoid prefix bypass. CIDRs require valid canonical networks (zero host bits); no zone IDs, hostnames or unresolved service tags. A more specific range is clean only for this supported rule. Active long-lived keys fail only when elapsed age is strictly greater than the injected day threshold. Invalid/future UTC dates remain incomplete even on inactive keys.

## Azure

Storage source `azure-storage-public-settings`: allowBlobPublicAccess, containerAccess private/blob/container, network publicNetworkAccess enabled/disabled, defaultAction allow/deny, effectiveInternetAccess allowed/blocked. A public anonymous container and effective internet path fail; disabled anonymous access/private container/known effective block are clean. Unknown or contradictory settings are incomplete; a deny default alone does not prove privacy.

Ingress source `azure-nsg-rules`: direction inbound/outbound, access allow/deny, priority 100–4096, protocol tcp/udp/all, ports [{from,to}], sources [CIDR], effective applies/shadowed. The normalizer must resolve NSG association, destination and precedence; unknown applicability/service tags remain incomplete.

Keys source `azure-key-inventory`: principalKind storage-account/service-principal, credentialType storage-account-key/client-secret respectively, createdAt, active. MFA source `entra-privileged-mfa`: principalKind user/federated, privileged, mfa status enabled/disabled, basis direct/conditional-access/federated, effective true. Registration alone is incomplete. Logging source `azure-diagnostic-settings`: enabled, categories {administrative:boolean,security:boolean}, exclusions none. Both local required categories must be enabled; unmodeled exclusions are incomplete.

## GCP

Storage source `gcs-public-settings`: publicAccessPrevention {configured:enforced/inherited/unspecified,effective:enforced/not-enforced}, bindings [{memberKind:all-users/all-authenticated-users/restricted,permission:read/write/none,condition:none}], aclPublic, uniformBucketLevelAccess. Unknown effective inheritance or any unmodeled IAM condition is incomplete. Effective public prevention blocks grants. Uniform access ignores ACLs but never removes IAM grants. Both public member kinds are public; restricted principals are clean.

Ingress source `gcp-vpc-firewall`: direction ingress/egress, action allow/deny, priority 0–65535, protocol tcp/udp/all, ports [{from,to}], sources [CIDR], disabled, effective applies/shadowed. The normalizer resolves hierarchy/target applicability; unknown effective facts are incomplete. Keys source `service-account-key-inventory`: principalKind service-account, keyType user-managed/system-managed, createdAt, active. Only active user-managed keys trigger age failure; all dates still validate.

MFA source `cloud-identity-mfa`: principalKind user/federated, privileged, mfa status enabled/disabled, basis direct/inherited/federated, effective true. Logging source `cloud-audit-logs`: enabled, categories {adminActivity:boolean,dataAccess:boolean}, exclusions none. Both categories are the v1 local required policy; unknown exclusions are incomplete, not waived. This is not a compliance attestation.
