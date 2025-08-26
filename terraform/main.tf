terraform {
  required_providers {
    authentik = {
      source  = "goauthentik/authentik"
      version = "2025.6.0"
    }
  }
}

provider "authentik" {
  url      = "http://auth-service.localhost/"
  insecure = true

  // BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/14
  // 
  // # Description
  // 
  // The token for administrative access to the auth service (Authentik) is stored in plain-text in the IaC source code.
  // 
  // # Impact  
  // 
  // - Everyone with access to the code can read data from the system an perform changes. 
  // - Changes can't be tracked to an individual. 
  //
  // # Background
  // 
  // This issue is related to CWE-259 (Use of Hard-coded Passwords) which is part of CWE-798 (Use of Hard-coded Credentials). 
  // Finding the right OWASP Top 10 category is not so easy as we're in the context of Infrastucture as Code. However, as IaC is
  // a critical component of the DevSecOps Liefcyle we also must ensure security of IaC source code. 
  // CWE-259 is part of OWASP Top 10 A02:2021 (Cryptographic Failure) and A07:2021 (Identification and Authentication Failures),
  // but none of those fits. A02:2021 focuses on cryptography and A07:2021 focuses on errors related to the implementation of
  // authentication and authorization, like brute force attack capabilites, unsafe default passwords like admin:admin, or missing
  // Multi-Factor Authentication (MFA).
  // The best suiting OWASP Top 10 Category seems to be A05:2021 (Security Misconfiguration) event though CWE-259 or CWE-789 are
  // not linked. This is due to the statement "Missing appropriate security hardening across any part of the application stack or 
  // improperly configured permissions on cloud services.".
  //
  // While this token doesn't directly affect the application, it provides administrative access to the IAM system. With this
  // token, full access (read/write) is possible as it is used to setup and configure auth service (Authentik) in a reproducible
  // way. All aspects of the CIA-Traid are threatened. Confidentialiy of user data is broken. Threat acctors can change data to 
  // their advantage (e.g. add permissions to their accounts: Elevation of Privileges) which violates the Integrity. With write
  // access they can also destroy the configuration so the system is no longer able to provide service which violates Availability. 
  // This issue is relevant in case the source code is leaked. In addition, it can also be used by an internal attacker. 
  //
  // https://owasp.org/Top10/A02_2021-Cryptographic_Failures/
  // https://owasp.org/Top10/A05_2021-Security_Misconfiguration/
  // https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/
  // https://cwe.mitre.org/data/definitions/259.html (CWE-259)
  // https://cwe.mitre.org/data/definitions/798.html (CWE-798)
  // 
  // At first, OWASP Top 10 A01:2021 (Broken Access Control) and CWE-540 (Inclusion of Sensitive Information in Source Code) 
  // seems to be applicable, because the token is hard-coded in this file. However, CWE-540 is primarly about the risk that 
  // this code containing the sensitive data is exposed to the public. 
  // For code that is provided to the client (e.g. the web app) this CWE might be applicable. However, Infrastucture as 
  // Code source code is usually internal and not served to the client. Only developers and CI/CD systems have access to this
  // code by checking out the repository. Therefore there is no direct risk that this code is sent to a user. The source code
  // can be leaked, but this is another story.
  // https://owasp.org/Top10/A01_2021-Broken_Access_Control/
  // https://cwe.mitre.org/data/definitions/540.html (CWE-540)
  //
  // # Remediation
  // 
  // The token should be read from an environment variable. With this approach every developer and CI/CD system can have its own
  // token. This allows to track changes and create an audit trail ("Who did what and when?"). 
  // The Principle of Least Privilege should be applied too. Everyone (developers and CI/CD systems) should only get the permissions
  // they need to do their job. 
  token = "LBVJKaF6G9BHt9N9Oa29qblOIuC9wHbI47wWHlFV6B2hqRppzhhhNSJy7d10"
}
