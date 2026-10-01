import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
    server: process.env.DB_SERVER || "localhost",
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || "POS-SmartK66",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE !== "false"
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

export const poolPromise =
    new sql.ConnectionPool(config).connect();

export { sql };