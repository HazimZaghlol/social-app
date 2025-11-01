import z from "zod";
import { GenderEnum } from "../../Common";

export const signUpValidator = {
  body: z.object({
    firstname: z.string().min(1, "First name is required"),
    lastname: z.string().min(1, "Last name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    gender: z.enum(GenderEnum),
    DOB: z.coerce.date(),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits long").max(11),
  }),
};
