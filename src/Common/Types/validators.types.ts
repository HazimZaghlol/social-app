import z from "zod";
import { signUpValidator } from "../../Validators";

export type SignUpBodyType = z.infer<typeof signUpValidator.body>;
