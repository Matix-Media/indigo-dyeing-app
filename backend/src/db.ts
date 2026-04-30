import dotenv from "dotenv";
import knex from "knex";

dotenv.config();

const environment = process.env.NODE_ENV || "development";

const db = knex({
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
});

export default db;
