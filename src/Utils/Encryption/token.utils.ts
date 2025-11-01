import Jwt, { JwtPayload, Secret, SignOptions, VerifyOptions } from "jsonwebtoken";

export const generateToken = (payload: string | object, secret: Secret = process.env.JWT_SECERT_KEY as string, options?: SignOptions): string => {
  return Jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string, secret: Secret = process.env.JWT_SECERT_KEY as string, options?: VerifyOptions): JwtPayload => {
  return Jwt.verify(token, secret, options) as JwtPayload;
};
