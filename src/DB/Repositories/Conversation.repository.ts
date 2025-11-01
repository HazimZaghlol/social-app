import { IConversation } from "../../Common";
import { ConversationModel } from "../Models/conversations.model";
import { BaseRepository } from "./base.repository";

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor() {
    super(ConversationModel as any);
  }
}
