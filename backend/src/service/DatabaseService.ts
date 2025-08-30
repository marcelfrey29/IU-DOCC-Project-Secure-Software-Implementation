import type { Logger } from "pino";
import { DataSource } from "typeorm";
import { DatabaseDataSource } from "../config/database.js";
import type { ConfigService } from "./ConfigService.js";

export class DatabaseService {
    private databaseDataSource: DataSource | undefined = undefined;
    constructor(
        private readonly logger: Logger,
        private readonly configService: ConfigService,
    ) {}

    async getDatabaseManager() {
        if (!this.databaseDataSource) {
            this.logger.info({}, "Initializing Database.");
            this.databaseDataSource = await DatabaseDataSource.initialize();
        }
        return this.databaseDataSource.manager;
    }
}
