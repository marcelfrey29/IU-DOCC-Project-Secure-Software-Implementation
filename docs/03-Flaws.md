# Flaws

|ID   | GitHub Issue | File/Location | Issue Type | CWEs |
| --- | ------------ | ------------- | ---------- | ---- |
| 1   | [Auth-Service Access Token in Terraform Source Code (#14)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/14)  | `terraform/main.tf`  | Hard-coded Credentials | CWE-259, CWE-789 |
| 2   | [PostgreSQL Password in Source Code (#15)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/15)  | `backend/src/config/database.ts`  | Hard-coded Credentials | CWE-259, CWE-789 |
| 3   | [Public exposure of private Recipes (Broken Access Control) (#18)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/18) | `backend/src/index.ts` | Broken Access Control | CWE-566, CWE-639, CWE-862 |
