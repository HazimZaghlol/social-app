import { Socket } from "socket.io";
import { ChatEvents } from "./chat.events";

export const ChatInitiator = (socket: Socket) => {
  const chatEvents = new ChatEvents(socket);
  chatEvents.SendPrivateMessageEvent();
  chatEvents.GetChatHistoryEvent(); 
  chatEvents.SendGroupMessageEvent(); 
  chatEvents.getGroupChatHistoryEvent();
};