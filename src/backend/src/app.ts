import "express-async-errors";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./openapi";
import { authRouter } from "./routes/auth";
import { requestsRouter } from "./routes/requests";
import { dashboardRouter } from "./routes/dashboard";
import { notificationsRouter } from "./routes/notifications";
import { adminRouter } from "./routes/admin";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/docs.json", (_req, res) => {
  res.json(openapiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/api/auth", authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);
