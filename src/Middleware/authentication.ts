import { BlackListedRepository } from "./../DB/Repositories/black-listed.repository";
import { NextFunction, Request, Response } from "express";
import { HttpException, verifyToken } from "../Utils";
import { IRequest, IUser } from "../Common";
import { blackListedTokenModel, UserModel } from "../DB/Models";
import { UserRepository } from "../DB/Repositories";
import { JwtPayload } from "jsonwebtoken";

const userRepo = new UserRepository(UserModel);
const blackListedRepo = new BlackListedRepository(blackListedTokenModel);
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw next(new HttpException("Unauthorized: No token provided", 401));
  }
  const token = authHeader.split(" ")[1];
  const decodedData = verifyToken(token, process.env.JWT_SECERT_KEY as string);
  const isBlackListed = await blackListedRepo.findOneDocument({ tokenId: decodedData.jti });
  if (isBlackListed) {
    throw next(new HttpException("token is BlackListed ", 401));
  }
  const user: IUser | null = await userRepo.findDocumentById(decodedData._id, "-password");
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: User not found" });
  }

  (req as unknown as IRequest).loggedInUser = { user, token: decodedData as JwtPayload };

  next();
};
