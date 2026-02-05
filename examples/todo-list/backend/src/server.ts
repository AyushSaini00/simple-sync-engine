import express from "express";
import type { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

const app: Express = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export default app;
