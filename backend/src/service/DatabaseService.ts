import type { Logger } from "pino";
import type { DataSource } from "typeorm";
import { DatabaseDataSource } from "../config/database.js";
import type { ConfigService } from "./ConfigService.js";

export class DatabaseService {
    private databaseDataSource: DataSource | undefined = undefined;
    constructor(
        private readonly logger: Logger,
        readonly _configService: ConfigService,
    ) {}

    async getDatabaseManager() {
        if (!this.databaseDataSource) {
            this.logger.info({}, "Initializing Database.");
            this.databaseDataSource = await DatabaseDataSource.initialize();
        }
        return this.databaseDataSource.manager;
    }
}
