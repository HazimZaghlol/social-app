import { Router } from "express";
import authService from "../Services/auth.service";
import { authenticate, validationMiddleware } from "../../../Middleware";
import { signUpValidator } from "../../../Validators";

const authController = Router();

authController.post("/signup", validationMiddleware(signUpValidator), authService.signUp);
authController.post("/signin", authService.signIn);
authController.post("/confirmEmail", authService.ConfirmEmail);
authController.post("/logout", authenticate, authService.Logout);

// 2FA Routes
authController.post("/2fa/enable", authenticate, authService.enable2FA);
authController.post("/2fa/verify-setup", authenticate, authService.verify2FASetup);
authController.post("/2fa/verify-login", authService.verifyLogin2FA);

export { authController };
