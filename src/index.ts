import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import * as controllers from "./Modules/controllers.index";
import { connectDB } from "./DB/db.connection";
dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.use("/api/auth", controllers.authController);
app.use("/api/users", controllers.profileController);

app.use((err: Error | null, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err ? 500 : 200;
  const message = err?.message || "something went wrong";
  res.status(statusCode).json({ message: err?.message || message });
});

const port: number | string = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
