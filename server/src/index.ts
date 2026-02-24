import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import authRouter from "./routes/auth";
import staffRouter from "./routes/staff";
import studentsRouter from "./routes/students";
import devicesRouter from "./routes/devices";
import loansRouter from "./routes/loans";
import dashboardRouter from "./routes/dashboard";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/staff", staffRouter);
app.use("/api/students", studentsRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/loans", loansRouter);
app.use("/api/dashboard", dashboardRouter);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || "3000");

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
