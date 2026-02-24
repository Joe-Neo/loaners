import "reflect-metadata";
import { DataSource } from "typeorm";
import { Student } from "./entities/Student";
import { Device } from "./entities/Device";
import { Loan } from "./entities/Loan";
import { Staff } from "./entities/Staff";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "loaners",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [Student, Device, Loan, Staff],
  migrations: ["dist/migrations/*.js"],
  subscribers: [],
});
