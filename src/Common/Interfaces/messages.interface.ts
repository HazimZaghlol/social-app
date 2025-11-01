import { Document, Types } from "mongoose";
import { IUser } from "./user.interface";
import { IConversation } from "./conversation.interface";

export interface IMessage extends Document<Types.ObjectId> {
  text: string;
  senderId: Types.ObjectId | IUser;
  conversationId: Types.ObjectId | IConversation;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
