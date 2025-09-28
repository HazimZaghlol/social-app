import crypto from "crypto";

/* ----------------------------- Phone  ------------------------------- */
export const encryptPhone = (plainPhone: string): string => {
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.PHONE_SECRET_KEY as string, "utf8"), Buffer.from(process.env.PHONE_IV as string, "utf8"));
  let encrypted = cipher.update(plainPhone, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

export const decryptPhone = (encryptedPhone: string): string => {
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(process.env.PHONE_SECRET_KEY as string, "utf8"), Buffer.from(process.env.PHONE_IV as string, "utf8"));
  let decrypted = decipher.update(encryptedPhone, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
