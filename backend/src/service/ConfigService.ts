import type { Logger } from "pino";

export class ConfigService {
    private readonly databaseUrl = process.env.DB_URL;
    constructor(private readonly logger: Logger) {}

    getDatabaseUrl() {
        return this.databaseUrl ?? "localhost";
    }
}
