import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  attachments: [
    {
      type: String,
    },
  ],
});

export const MessageModel = mongoose.model("Message", messageSchema);