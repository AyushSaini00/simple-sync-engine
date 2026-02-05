import express from "express";
import type { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import todosRouter from "./todosRoute.js";

const app: Application = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/todos", todosRouter);

export default app;
