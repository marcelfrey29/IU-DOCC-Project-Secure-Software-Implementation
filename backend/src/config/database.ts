import { DataSource } from "typeorm";
import { Recipe } from "../model/Recipe.js";

export const DatabaseDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_URL ?? "localhost", // Read the DB URL from Environment (required for K8s) and fallback to localhost (local development)
    port: 5432,
    username: "social-recipie-db-rw-user",
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
     * # Remetiation
     *
     * Use environment variables and pass the username and password to the application.
     */
    password: "ZuVUQfMg7i3vLEcZN5YqjswoXX++en9lZwG2DK6sYqHqZnMr",
    database: "socialrecipe",
    synchronize: true,
    logging: false,
    entities: [Recipe],
    migrations: [],
    subscribers: [],
});
