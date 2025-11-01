import { MessagesRepository } from "./../../../DB/Repositories/messages.repository";
import { Socket } from "socket.io";
import { ConversationRepository } from "../../../DB/Repositories";
import { ConversationType } from "../../../Common";
import { getIOInstance } from "../../../Gatways/socketIo.gatways";
import { connectedSockets } from "../../../Gatways/socketIo.gatways";

export class ChatService {
  private ConversationRepository: ConversationRepository = new ConversationRepository();
  private MessagesRepository: MessagesRepository = new MessagesRepository();

  async joinPrivateChat(socket: Socket, targetUserId: string) {
    let conversation = await this.ConversationRepository.findOneDocument({
      type: ConversationType.DIRECT,
      members: { $all: [socket.data.user._id, targetUserId] },
    });
    if (!conversation) {
      conversation = await this.ConversationRepository.createNewDocument({
        type: ConversationType.DIRECT,
        members: [socket.data.user._id, targetUserId],
      });
    }

    socket.join(conversation._id.toString());

    return conversation;
  }

  async sendPrivateMessage(socket: Socket, data: unknown) {
    const { text, targetUserId } = data as { text: string; targetUserId: string };
    const conversation = await this.joinPrivateChat(socket, targetUserId);
    const message = await this.MessagesRepository.createNewDocument({
      text: text,
      conversationId: conversation._id,
      senderId: socket.data.user._id,
    });
    getIOInstance()?.to(conversation._id.toString()).emit("message-sent", message);
  }

  async getChatHistory(socket: Socket, targetUserId: string) {
    const conversation = await this.joinPrivateChat(socket, targetUserId);
    const messages = await this.MessagesRepository.findDocumentsByFilter({
      conversationId: conversation._id,
    });
    socket.emit("chat-history", messages);
    return messages;
  }

  async joinGroupChat(socket: Socket, groupId: string) {
    let conversation = await this.ConversationRepository.findOneDocument({
      _id: groupId,
      type: ConversationType.GROUP,
    });
    if (!conversation) {
      throw new Error("Group conversation not found");
    }
   
    socket.join(conversation._id.toString());
    return conversation;
  }

  async sendGroupMessage(socket: Socket, data: unknown) {
    const { text, groupId } = data as { text: string; groupId: string };
    const conversation = await this.joinGroupChat(socket, groupId);
    const message = await this.MessagesRepository.createNewDocument({
      text: text,
      conversationId: conversation._id,
      senderId: socket.data.user._id,
    });
    console.log("Sending message to room:", conversation._id.toString());
    console.log("Message:", message);
    getIOInstance()?.to(conversation._id.toString()).emit("message-sent", message);
  }

  async getGroupChatHistory(socket: Socket, groupId: string) {
    const conversation = await this.joinGroupChat(socket, groupId);
    const messages = await this.MessagesRepository.findDocumentsByFilter({
      conversationId: conversation._id,
    });
    socket.emit("group-chat-history", messages);
    return messages;
  }
}
