import { Router } from "express";
import { authenticate } from "../../../Middleware";
import reactService from "../Services/react.service";

const reactController = Router();


reactController.post("/:postId/toggle", authenticate, reactService.toggleReact);


reactController.get("/:postId/status", authenticate, reactService.getReactStatus);

export { reactController };
