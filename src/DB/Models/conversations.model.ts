import mongoose, { Types } from "mongoose";


const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ["direct", "group"], required: true, default: "direct" },
  name: { type: String },
  members: [
    {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
});
export const ConversationModel = mongoose.model("Conversation", conversationSchema);
