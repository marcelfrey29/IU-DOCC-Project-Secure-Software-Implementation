import { DataSource } from "typeorm";
import { Recipe } from "../model/Recipe.js";
import { RecipeComment } from "../model/RecipeComment.js";

export const DatabaseDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_URL ?? "localhost", // Read the DB URL from Environment (required for K8s) and fallback to localhost (local development)
    port: 5432,
    username: process.env.DB_USERNAME,
    /**
     * BUG: https://github.com/marcelfrey29/IU-DOCC-Project-Secure-Software-Implementation/issues/15
     *
     * # Description
     *
     * The password (and username) to access the PostgreSQL Database are stored in plain-text in the source code.
     *
     * # Impact
     *
     * - Everyone with access to the repository can read and write to the database
     * - Violates Confidentiality (access to data), Integrity (threat actor can modify data in the database),
     *   and Availability (threat actor can delete data / the entire database)
     *
     * # Background
     *
     * Hard-coded Credentials are part of CWE-259 (Use of Hard-coded Passwords) which is part of CWE-798 (Use of Hard-coded Credentials).
     * This issue belongs to OWASP Top 10 A07:2021 (Identification and Authentication Failures) because the application "Uses plain text,
     * encrypted, or weakly hashed passwords data stores" which also relates to OWASP Top 10 A02:2021 (Cryptographic Failures). However,
     * A02:2021 focuses on the cryptography itself while we have a problem with the secure identification and authorization due to the
     * plain-text password.
     *
     * https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/
     * https://cwe.mitre.org/data/definitions/259.html (CWE-259)
     * https://cwe.mitre.org/data/definitions/798.html (CWE-798)
     *
     * # Remediation
     *
     * Use environment variables and pass the username and password to the application.
     *
     * # Fix
     *
     * Both the username and password for the database must be securely injected via environment variable. To do this, several changes
     * are required:
     * - Two new environment variables must be defined: "DB_USERNAME" and "DB_PASSWORD"
     * - Here, in the `database.ts` file, the static data must be removed and the environment variables must be read
     * - The Kubernetes Manifest must be updated so that the environment variables are injected into the container, see the
     *   `backend.deployment.yaml file. The value for the environment variable must itself be read from an environment variable.
     * - The `deploy.sh` file must be updated to include the password in the K8s manifest because - obviously - we can't store it there.
     * - When running the backend locally, we must provide the environment variables: `DB_USERNAME="<username>" DB_PASSWORD="<password>" npm run dev`
     */
    password: process.env.DB_PASSWORD,
    database: "socialrecipe",
    synchronize: true,
    logging: false,
    entities: [Recipe, RecipeComment],
    migrations: [],
    subscribers: [],
});
