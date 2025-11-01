import { Document, Types } from "mongoose";

export interface IComment extends Document<Types.ObjectId> {
  content: string;
  refId: Types.ObjectId;
  ownerId: Types.ObjectId;
  onModel: "Post" | "Comment";
  createdAt: Date;
  updatedAt: Date;
  isFrozen?: boolean;
}
