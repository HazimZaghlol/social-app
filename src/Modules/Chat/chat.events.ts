import { Socket } from "socket.io";
import { ChatService } from "./Services/chat.service";

export class ChatEvents {
  private chatService: ChatService = new ChatService();
  constructor(private socket: Socket) {}

  SendPrivateMessageEvent() {
    this.socket.on("send-private-message", async (data) => {
      await this.chatService.sendPrivateMessage(this.socket, data);
    });
  }

  GetChatHistoryEvent() {
    this.socket.on("get-chat-history", async (data) => {
      this.chatService.getChatHistory(this.socket, data);
    });
  }

  SendGroupMessageEvent() {
    this.socket.on("send-group-message", async (data) => {
      await this.chatService.sendGroupMessage(this.socket, data);
    });
  }
  getGroupChatHistoryEvent() {
    this.socket.on("get-group-chat", async (data) => {
      this.chatService.getGroupChatHistory(this.socket, data);
    });
  }
}
