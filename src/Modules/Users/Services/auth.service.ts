import { NextFunction, Request, Response } from "express";
import { IRequest, IUser, OTPTypeEnum, SignUpBodyType } from "../../../Common";
import { UserRepository } from "../../../DB/Repositories/user.repository";
import { blackListedTokenModel, UserModel } from "../../../DB/Models";
import { compareHash, ConflictException, encryptPhone, generateHash, generateToken, sendEmailEvent } from "../../../Utils";
import { generateOTP } from "../../../Utils/OTP";
import crypto from "crypto";
import { SignOptions } from "jsonwebtoken";
import { BlackListedRepository } from "../../../DB/Repositories/black-listed.repository";
import { FailedResponse, SuccessResponse } from "../../../Utils/Response/response-helper.utils";

class AuthService {
  private userRepo: UserRepository = new UserRepository(UserModel);
  private blackListedRepo: BlackListedRepository = new BlackListedRepository(blackListedTokenModel);

  // *************************************** SignUp ***************************************
  signUp = async (req: Request, res: Response, next: NextFunction) => {
    const { firstname, lastname, email, password, gender, DOB, phoneNumber }: SignUpBodyType = req.body;

    const isEmailExist = await this.userRepo.findOneDocument({ email }, "email");
    if (isEmailExist) {
      throw next(new ConflictException("Email already in use", { existingEmail: email }));
    }

    const otpPlain = generateOTP();
    const signedOTP = {
      value: await generateHash(otpPlain),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpType: OTPTypeEnum.SIGNUP_OTP,
    };

    const newUser = await this.userRepo.createNewDocument({
      firstname,
      lastname,
      email,
      password,
      gender,
      DOB,
      phoneNumber,
      OTPs: [signedOTP],
    });

    const emailData = {
      to: newUser.email,
      subject: "🎉 Welcome to Our App",
      html: `
            <h2>Hi ${newUser.firstname} 👋</h2>
            <p>Thanks for signing up to our platform. We're excited to have you on board! 🚀</p>
            <h3>OTP: ${otpPlain}</h3>
            <p>Here are your details:</p>
            <ul>
              <li><strong>Full Name:</strong> ${newUser.fullName}</li>
              <li><strong>Email:</strong> ${newUser.email}</li>
              <li><strong>Gender:</strong> ${newUser.gender}</li>
              <li><strong>Age:</strong> ${newUser.age}</li>
            </ul>
            <br/>
            <p>Best regards,<br/>The Team</p>
          `,
      type: "signup-otp",
    };
    sendEmailEvent(emailData);

    return res.status(201).json({ message: "User created successfully", user: newUser });
  };

  // *************************************** SignIn ***************************************
  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: Partial<IUser> = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await this.userRepo.findOneDocument({ email }, "+password");
    if (!user) {
      throw next(new ConflictException("User not found", { invalidEmail: email }));
    }

    if (!user.isConfirmed) {
      return res.status(403).json({
        message: "Please confirm your email before signing in",
      });
    }

    const isPasswordValid = await compareHash(password!, user.password!);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // Generate and send OTP for 2FA
      const otpPlain = generateOTP();
      const signedOTP = {
        value: await generateHash(otpPlain),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        otpType: OTPTypeEnum.LOGIN_2FA_OTP,
      };

      await this.userRepo.updateOneDocument({ _id: user._id }, { $push: { OTPs: signedOTP } });

      const emailData = {
        to: user.email,
        subject: "Login Verification Code",
        html: `
          <h2>Hi ${user.firstname} 👋</h2>
          <p>Here's your login verification code:</p>
          <h3>${otpPlain}</h3>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't try to log in, please secure your account immediately.</p>
          <br/>
          <p>Best regards,<br/>The Team</p>
        `,
      };
      sendEmailEvent(emailData);

      return res.status(200).json(
        SuccessResponse("2FA verification required", {
          requiresOTP: true,
          email: user.email,
          message: "Please check your email for the verification code",
        })
      );
    }

    // If 2FA is not enabled, proceed with normal login
    const jti = crypto.randomUUID();
    const access_token = generateToken({ _id: user._id, role: user.role, firstname: user.firstname, lastname: user.lastname }, process.env.JWT_SECERT_KEY, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION as SignOptions["expiresIn"]) || "1d",
      jwtid: jti,
    });

    const refreshToken = generateToken({ _id: user._id, role: user.role, firstname: user.firstname, lastname: user.lastname }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION as SignOptions["expiresIn"]) || "7d",
      jwtid: jti,
    });

    return res.status(200).json(SuccessResponse("Signed in successfully", { access_token, refreshToken, user }));
  };

  // *************************************** Confirm Email ***************************************
  ConfirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    if (!otp || !email) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await this.userRepo.findOneDocument({ email }, "+OTPs");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find either signup OTP or change email OTP
    const validOTP = user.OTPs?.find((otpRecord) => otpRecord.otpType === OTPTypeEnum.SIGNUP_OTP || otpRecord.otpType === OTPTypeEnum.CHANGE_EMAIL_OTP);

    if (!validOTP) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (validOTP.expiresAt! < new Date()) {
      return res.status(400).json(FailedResponse("OTP has expired. Please request a new one."));
    }

    const isOTPValid = await compareHash(otp, validOTP.value);
    if (!isOTPValid) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Clear the OTP after successful verification
    await this.userRepo.updateOneDocument(
      { email },
      {
        isConfirmed: true,
      }
    );

    const confirmationType = validOTP.otpType === OTPTypeEnum.SIGNUP_OTP ? "signup" : "email change";
    return res.status(200).json(SuccessResponse(`Email confirmed successfully for ${confirmationType}`));
  };

  // *************************************** logout ***************************************
  Logout = async (req: Request, res: Response, next: NextFunction) => {
    const {
      token: { jti, exp },
    } = (req as unknown as IRequest).loggedInUser;
    const blackListedToken = await this.blackListedRepo.createNewDocument({
      tokenId: jti,
      expiresAt: new Date(exp! * 1000),
    });
    return res.status(200).json(SuccessResponse("Logged out successfully", { blackListedToken }));
  };

  // *************************************** Enable 2FA ***************************************
  enable2FA = async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as IRequest).loggedInUser.user;

    if (user.isTwoFactorEnabled) {
      return next(new ConflictException("2FA is already enabled"));
    }

    const otpPlain = generateOTP();
    const signedOTP = {
      value: await generateHash(otpPlain),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpType: OTPTypeEnum.ENABLE_2FA_OTP,
    };

    await this.userRepo.updateOneDocument({ _id: user._id }, { $push: { OTPs: signedOTP } });

    const emailData = {
      to: user.email,
      subject: "Enable 2-Factor Authentication",
      html: `
        <h2>Hi ${user.firstname} 👋</h2>
        <p>You've requested to enable 2-factor authentication for your account.</p>
        <h3>Your verification code: ${otpPlain}</h3>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br/>
        <p>Best regards,<br/>The Team</p>
      `,
    };
    sendEmailEvent(emailData);

    return res.json(SuccessResponse("2FA verification code sent to your email"));
  };

  // *************************************** Verify 2FA Setup ***************************************
  verify2FASetup = async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as IRequest).loggedInUser.user;
    const { otp } = req.body;

    if (!otp) {
      return next(new ConflictException("OTP is required"));
    }

    const userWithOTPs = await this.userRepo.findOneDocument({ _id: user._id }, "+OTPs");
    if (!userWithOTPs) {
      return next(new ConflictException("User not found"));
    }

    const validOTP = userWithOTPs.OTPs?.find((otpRecord) => otpRecord.otpType === OTPTypeEnum.ENABLE_2FA_OTP);

    if (!validOTP) {
      return next(new ConflictException("No valid OTP found. Please request a new one"));
    }

    if (validOTP.expiresAt < new Date()) {
      return next(new ConflictException("OTP has expired. Please request a new one"));
    }

    const isOTPValid = await compareHash(otp, validOTP.value);
    if (!isOTPValid) {
      return next(new ConflictException("Invalid OTP"));
    }

    await this.userRepo.updateOneDocument(
      { _id: user._id },
      {
        isTwoFactorEnabled: true,
        $pull: { OTPs: { otpType: OTPTypeEnum.ENABLE_2FA_OTP } },
      }
    );

    return res.json(SuccessResponse("2-factor authentication enabled successfully"));
  };

  // *************************************** Verify Login 2FA ***************************************
  verifyLogin2FA = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new ConflictException("Email and OTP are required"));
    }

    const user = await this.userRepo.findOneDocument({ email }, "+OTPs");
    if (!user) {
      return next(new ConflictException("User not found"));
    }

    const validOTP = user.OTPs?.find((otpRecord) => otpRecord.otpType === OTPTypeEnum.LOGIN_2FA_OTP);

    if (!validOTP) {
      return next(new ConflictException("No valid OTP found. Please try logging in again"));
    }

    if (validOTP.expiresAt < new Date()) {
      return next(new ConflictException("OTP has expired. Please try logging in again"));
    }

    const isOTPValid = await compareHash(otp, validOTP.value);
    if (!isOTPValid) {
      return next(new ConflictException("Invalid OTP"));
    }

    const jti = crypto.randomUUID();
    const access_token = generateToken({ _id: user._id, role: user.role, firstname: user.firstname, lastname: user.lastname }, process.env.JWT_SECERT_KEY, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION as SignOptions["expiresIn"]) || "1d",
      jwtid: jti,
    });

    const refreshToken = generateToken({ _id: user._id, role: user.role, firstname: user.firstname, lastname: user.lastname }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION as SignOptions["expiresIn"]) || "7d",
      jwtid: jti,
    });

    // Remove the used OTP
    await this.userRepo.updateOneDocument({ _id: user._id }, { $pull: { OTPs: { otpType: OTPTypeEnum.LOGIN_2FA_OTP } } });

    return res.json(SuccessResponse("Login successful", { access_token, refreshToken, user }));
  };
}

export default new AuthService();
