import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { requestsRouter } from "./routes/requests";
import { dashboardRouter } from "./routes/dashboard";
import { notificationsRouter } from "./routes/notifications";
import { adminRouter } from "./routes/admin";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
