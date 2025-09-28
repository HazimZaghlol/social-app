import { NextFunction, Request, Response } from "express";
import { IUser, OTPTypeEnum } from "../../../Common";
import { UserRepository } from "../../../DB/Repositories/user.repository";
import { UserModel } from "../../../DB/Models";
import { compareHash, encryptPhone, generateHash, sendEmailEvent } from "../../../Utils";
import { generateOTP } from "../../../Utils/OTP";

class AuthService {
  private userRepo: UserRepository = new UserRepository(UserModel);

  // *************************************** SignUp ***************************************
  signUp = async (req: Request, res: Response, next: NextFunction) => {
    const { firstname, lastname, email, password, gender, DOB, phoneNumber }: Partial<IUser> = req.body;

    const isEmailExist = await this.userRepo.findOneDocument({ email }, "email");
    if (isEmailExist) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const encryptPhoneNumber = encryptPhone(phoneNumber! as string);

    const hashedPassword = await generateHash(password!);
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
      password: hashedPassword,
      gender,
      DOB,
      phoneNumber: encryptPhoneNumber,
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
    const user = await this.userRepo.findOneDocument({ email }, "+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await compareHash(password!, user.password!);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    return res.status(200).json({ message: "User signed in successfully" });
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
    const validOTP = user.OTPs?.find((otpRecord) => otpRecord.otpType === OTPTypeEnum.SIGNUP_OTP);
    if (!validOTP) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }
    if (validOTP.expiresAt! < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    const isOTPValid = await compareHash(otp, validOTP.value);
    if (!isOTPValid) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
    await this.userRepo.updateOneDocument({ email }, { isConfirmed: true });

    return res.status(200).json({ message: "Email confirmed successfully" });
  };
}
export default new AuthService();
