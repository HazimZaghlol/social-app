import { Router } from "express";
import authService from "../Services/auth.service";

const authController = Router();

authController.post("/signup", authService.signUp);
authController.post("/signin", authService.signIn);
authController.post("/confirmEmail", authService.ConfirmEmail);

export { authController };
