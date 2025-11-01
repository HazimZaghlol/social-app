import { IMessage } from "../../Common";
import { MessageModel } from "../Models/messages.model";
import { BaseRepository } from "./base.repository";

export class MessagesRepository extends BaseRepository<IMessage> {
  constructor() {
    super(MessageModel as any);
  }
}
