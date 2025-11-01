import { Document, Types } from "mongoose";
import { IUser } from "./user.interface";

export interface IPost extends Document<Types.ObjectId> {
  description: string;
  attachments?: string[];
  ownerId: Types.ObjectId | IUser;
  allowComments: boolean;
  tags?: Types.ObjectId[] | IUser[];
  isFrozen: boolean;
  frozenAt?: Date;
  frozenBy?: Types.ObjectId | IUser;
}
