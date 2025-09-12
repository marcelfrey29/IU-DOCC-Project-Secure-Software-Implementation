import type { Logger } from "pino";

export class ConfigService {
    private readonly databaseUrl = process.env.DB_URL;
    private readonly authServiceUrl = process.env.AUTH_SERVICE_URL;
    constructor(readonly _logger: Logger) {}

    getDatabaseUrl() {
        // In K8s, we need to use the PostgreSQL Service because it provides a static network endpoint
        // and because the database is only reachable with in the K8s network.
        // For local developmen, we fallback to `localhost` because we port-forward the DB server
        // to localhost, as defined in the README file.
        return this.databaseUrl ?? "localhost";
    }

    getAuthServiceUrl() {
        // In K8s we must use the service object to connect to Authentik because `*.localhost` is Pod-
        // internal. For local development, we can rely on `localhost` because all services are exposed
        // and routed via the host.
        return this.authServiceUrl ?? "http://auth-service.localhost";
    }
}
