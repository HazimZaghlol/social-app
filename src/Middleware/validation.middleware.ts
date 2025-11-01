import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { BadRequestException } from "../Utils";

type RequestKeyType = keyof Request;
type SchemaType = Partial<Record<RequestKeyType, ZodType>>;
type ValidationErrorType = {
  key: RequestKeyType;
  issues: { path: PropertyKey[]; message: string }[];
};

export const validationMiddleware = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqKeys: RequestKeyType[] = ["body", "params", "query", "headers"];
    const validationErrors: ValidationErrorType[] = [];
    for (const key of reqKeys) {
      if (schema[key]) {
        const parseResult = schema[key].safeParse(req[key]);
        if (!parseResult?.success) {
          const issues = parseResult.error?.issues?.map((issue) => ({
            path: issue.path,
            message: issue.message,
          }));
          validationErrors.push({ key, issues });
        }
      }
    }
    if (validationErrors.length > 0) {
      throw new BadRequestException("Validation Error", { validationErrors });
    }
    next();
  };
};
