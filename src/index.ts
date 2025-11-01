import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import * as controllers from "./Modules/controllers.index";
import { connectDB } from "./DB/db.connection";
import { HttpException } from "./Utils";
import { FailedResponse } from "./Utils/Response/response-helper.utils";
import cors from "cors";
import { ioInatializer } from "./Gatways/socketIo.gatways";
dotenv.config();

const app = express();

connectDB();

app.use(express.json());
app.use(cors());
app.use("/auth", controllers.authController);
app.use("/user", controllers.profileController);
app.use("/posts", controllers.postController);
app.use("/reacts", controllers.reactController);
app.use("/comments", controllers.commentController);

app.use((err: HttpException | Error, req: Request, res: Response, next: NextFunction) => {
  const message = err?.message || "something went wrong";
  if (err instanceof HttpException) {
    return res.status(err.statusCode).json(FailedResponse(err.message, err.statusCode, err.details));
  } else {
    return res.status(500).json(FailedResponse(message, 500, err));
  }
});

const port: number | string = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
ioInatializer(server);
