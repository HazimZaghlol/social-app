import { Router } from "express";
import authService from "../Services/auth.service";
import { authenticate, validationMiddleware } from "../../../Middleware";
import { signUpValidator } from "../../../Validators";

const authController = Router();

authController.post("/signup", validationMiddleware(signUpValidator), authService.signUp);
authController.post("/signin", authService.signIn);
authController.post("/confirmEmail", authService.ConfirmEmail);
authController.post("/logout", authenticate, authService.Logout);

export { authController };
