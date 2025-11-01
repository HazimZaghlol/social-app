import { Document, Types } from "mongoose";
import { IUser } from "./user.interface";
import { IPost } from "./post.interface";

export interface IReact extends Document<Types.ObjectId> {
  userId: Types.ObjectId | IUser;
  postId: Types.ObjectId | IPost;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}
