# Flaws

|ID   | GitHub Issue | File/Location | Issue Type | CWEs |
| --- | ------------ | ------------- | ---------- | ---- |
| 1   | [Auth-Service Access Token in Terraform Source Code (#14)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/14)  | `terraform/main.tf`  | Hard-coded Credentials | CWE-259, CWE-789 |
| 2   | [PostgreSQL Password in Source Code (#15)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/15)  | `backend/src/config/database.ts`  | Hard-coded Credentials | CWE-259, CWE-789 |
| 3   | [Public exposure of private Recipes (Broken Access Control) (#18)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/18) | `backend/src/index.ts` | Broken Access Control | CWE-566, CWE-639, CWE-862 |
| 4   | [XSS in Web App on Recipe Detail Page (#19)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/19) | `web-app/src/pages/recipe-details.tsx` | Stored XSS (Client-Part: XSS) | CWE-79, CWE-80 |
| 5   | [Improper input validation & sanitization before persisting data leads to Stored XSS (#20)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/20) | `backend/src/index.ts`| Stored XSS (Backend-Part: Improper Input Validation) | CWE-79, CWE-80, CWE-96, CWE-157, CWE-184, CWE-116 |
| 6   | [User Access Tokens are logged (#22)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/22) | `backend/src/index.ts`| Logging of sensitive information | CWE-532 |
