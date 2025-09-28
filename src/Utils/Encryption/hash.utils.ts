import { compare, hash } from "bcryptjs";

/* ----------------------------- hashing  ---------------------------- */
export const generateHash = async (plainText: string, saltRounds: number = parseInt(process.env.SALT_ROUNDS as string)): Promise<string> => {
  return await hash(plainText, saltRounds);
};

export const compareHash = async (plainText: string, hashedText: string): Promise<boolean> => {
  return await compare(plainText, hashedText);
};
