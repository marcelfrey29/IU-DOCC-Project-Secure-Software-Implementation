# Flaws

|ID   | GitHub Issue | File/Location | Issue Type | CWEs | OWASP Top 10 |
| --- | ------------ | ------------- | ---------- | ---- | --- |
| 1   | [Auth-Service Access Token in Terraform Source Code (#14)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/14)  | `terraform/main.tf`  | Hard-coded Credentials | CWE-259, CWE-789 | A05:2021 |
| 2   | [PostgreSQL Password in Source Code (#15)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/15)  | `backend/src/config/database.ts`  | Hard-coded Credentials | CWE-259, CWE-789 | A07:2021 |
| 3   | [Public exposure of private Recipes (Broken Access Control) (#18)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/18) | `backend/src/index.ts` | Broken Access Control | CWE-566, CWE-639, CWE-862 | A01:2021 |
| 4   | [XSS in Web App on Recipe Detail Page (#19)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/19) | `web-app/src/pages/recipe-details.tsx` | Stored XSS (Client-Part: XSS) | CWE-79, CWE-80 | A03:2021 |
| 5   | [Improper input validation & sanitization before persisting data leads to Stored XSS (#20)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/20) | `backend/src/index.ts`| Stored XSS (Backend-Part: Improper Input Validation) | CWE-79, CWE-80, CWE-96, CWE-157, CWE-184, CWE-116 | A03:2021 |
| 6   | [User Access Tokens are logged (#22)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/22) | `backend/src/index.ts`| Logging of sensitive information | CWE-532 | A09:2021 |
| 7   | [Raw Exceptions are returned to Clients (#25)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/25)|`backend/src/index.ts`|Sensitive information in error response|CWE-201, CWE-209 |A04:2021 |
| 8   | [SQL Injection in `GET /recipes/:recipeId/comments` Endpoint (#27)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/27)| `backend/src/index.ts` | SQL Injection | CWE-89 | A03:2021 |
| 9   | [Node 18 is EOL & Image is vulnerable (#29)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/29)| `backend/Dockerfile` | Outdated & Vulnerable Component | CWE-1104 | A06:2021 |
