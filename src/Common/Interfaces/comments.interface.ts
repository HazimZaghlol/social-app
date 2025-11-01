import { Document, Types } from "mongoose";
import { IUser } from "./user.interface";
import { IPost } from "./post.interface";

export interface IComment extends Document<Types.ObjectId> {
  content: string;
  attachments?: string[];
  refId: Types.ObjectId 
  ownerId: Types.ObjectId 
  onModel: "Post" | "Comment"; 
}
