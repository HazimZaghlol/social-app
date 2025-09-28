import { Document } from "mongoose";
import { GenderEnum, OTPTypeEnum, ProviderEnum, RoleEnum } from "../Enums/user.enums";

export interface IUser extends Document {
  firstname: string;
  lastname: string;
  fullName?: string;
  email: string;
  password: string;
  age?: number;
  role: RoleEnum;
  gender: GenderEnum;
  DOB?: Date;
  coverPic?: string;
  profilePic?: string;
  provider: ProviderEnum;
  isVerified: boolean;
  phoneNumber?: string;
  googleId?: string;
  OTPs?: [
    {
      value: string;
      expiresAt: Date;
      otpType: OTPTypeEnum;
    }
  ];
  isConfirmed: boolean;
}

export interface IEmail {
  to: string;
  subject: string;
  cc?: string;
  content?: string;
  attachments?: [];
  html: string;
}
