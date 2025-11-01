import { Document, Types } from "mongoose";
import { IUser } from "./user.interface";

export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

export interface IConversation extends Document<Types.ObjectId> {
  type: ConversationType;
  name?: string;
  members: Types.ObjectId[] | IUser[];
  createdAt?: Date;
  updatedAt?: Date;
}
