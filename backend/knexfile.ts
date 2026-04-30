import dotenv from "dotenv";
import type { Knex } from "knex";

dotenv.config();

const config: { [key: string]: Knex.Config } = {
    development: {
        client: "pg",
        connection: {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "5432"),
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "postgres",
            database: process.env.DB_NAME || "indigo_dyeing",
        },
        migrations: {
            extension: "ts",
            directory: "./migrations",
        },
        seeds: {
            extension: "ts",
            directory: "./seeds",
        },
    },
    production: {
        client: "pg",
        connection: process.env.DATABASE_URL,
        migrations: {
            extension: "ts",
            directory: "./migrations",
        },
        seeds: {
            extension: "ts",
            directory: "./seeds",
        },
    },
};

module.exports = config;
