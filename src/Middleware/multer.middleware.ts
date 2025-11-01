import multer from "multer";

export const multerMiddleware = () => {
  return multer({ storage: multer.diskStorage({}) });
};
