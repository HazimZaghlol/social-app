import { Document, Types } from "mongoose";
import { FriedShipStatusEnum, GenderEnum, OTPTypeEnum, ProviderEnum, RoleEnum } from "../Enums/user.enums";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface IUser extends Document<Types.ObjectId> {
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
  isTwoFactorEnabled: boolean;
}

export interface IEmail {
  to: string;
  subject: string;
  cc?: string;
  content?: string;
  attachments?: [];
  html: string;
}

export interface IRequest extends Request {
  loggedInUser: { user: IUser; token: JwtPayload };
}

export interface IBlackListedToken extends Document<Types.ObjectId> {
  tokenId: string;
  expiresAt: Date;
}

export interface IFriendShip extends Document<Types.ObjectId> {
  requestFormId: Types.ObjectId;
  requestToId: Types.ObjectId;
  status: FriedShipStatusEnum;
}
