# Security Processes

## Prevention of Vulnerabilities & Bugs

- **Awareness & Training**: Be up-to-date of latest attack trends
    - Examples: OWASP Top 10, CWE, CVEs
    - Critical thinking and reflection during all activities along the SDLC (RE, Design, Coding, Testing, ...)
    - Share learnings
    - Collaboration with dedicated Security Team
    - Security Champtions in agile application & platform teams
- **Code Reviews**: Second pair of eyes, four-eye principle
    - Higher chance to detect a problem early
    - Sr. Engineers can give feedback, support & educate others
- **Make Security a Priority** and treat it as "job zero"[^1]
    - Security over Features
    - Proper prioritization
    - Consider Non-Function Requirements (NFRs) from the beginning (treat them like "normal" requirements and include Acceptance Criteria, DoR, and DoD)
- **Keep Dependencies (Packages & Container Images) up-to-date**, regularly **Audit** them, and use **Automation** when possible
    - Dependencies are great, but only use them if they're necessary (prefer the standard library)
    - Automatic Dependency Updates (e.g. GitHub Dependabot): Less risk of having outdated or vulnerable components 
    - Tasks: [Setup Dependabot (#33)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/33)
- **Shift Left** and consider security early
    - Follow Security by Design principles
    - Consider it during every phase of the SDLC, starting with Requirements Engineering
        - Design
            - E.g. ensure there's a global Error Handling Middleware to prevent leaking raw exceptions (Software must "Fail Securely")
            - E.g. design for scalability to increase resilience against DoS/DDoS attacks
    - Application Security Testing (early & often)
    - Test NFRs
- **CI** as **Quality Gate**
    - Block merging of changes that introduce vulnerabilities
    - Block merging if issues with a `HIGH` severity exist
        - Resolving this has priority to unblock the pipeline
- **Zero Trust** and **Principle of Least Privilege**
- **Use IaC** and **apply the same concepts** (e.g. CI, Testing, SAST, ...)
- Prevention can start during development by [detection](#detection-of-vulnerabilities--bugs)

## Detection of Vulnerabilities & Bugs

- **Integrate Linters, Formatters and Checking-Tools**
    - In IDE and more importantly in CI/CD, so that the `main` branch is stable, clean, and secure at any given time
    - Maintain clean code, align to standards, and have a standardized codebase
    - Tasks: [Setup CI: Formatting & Linting (#34)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/34)
- **Application Security Testing (AST)**
    - Static Application Security Testing (SAST)
        - Scan Source Code & IaC Code (vulnerabilities, flaws, secrets)
        - Software Component Analysis (SCA): Check OSS dependencies and container images
    - Dynamic Application Security Testing (DAST)
        - End-to-End Tests should also cover attack scenarios (leave the happy path)
    - Software Component Analysis (SCA)
    - Task: [Setup Application Security Testing (#35)](https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/35)
- **Patch Management**: Keep track of assets and update them if updates are availabel 
- **Vulnerability Management**: Keep track of new CVEs for used software and apply patches
    - Have proper & tested processes in place
- Collect **Logs & Metrics** and **analyze them** to **identify malicious or abnormal behavior**
    - Don't include sensitive data in logs, but enough information to detect attacks (find the right balance)
    - Use SIEM and Threat Intelligence
- **Continuous Observability & Testing is key**
    - Security is not a one-time-job

[^1]: https://aws.amazon.com/blogs/enterprise-strategy/security-at-aws/
