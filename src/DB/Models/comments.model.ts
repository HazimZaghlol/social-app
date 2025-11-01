import mongoose from "mongoose";
import { IComment } from "../../Common";

const commentSchema = new mongoose.Schema<IComment>({
  content: { type: String, required: true },
  attachments: [{ type: String }],
 refId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "onModel",
    required: true,
  },
  onModel: {
    type: String,
    required: true,
    enum: ["Post", "Comment"],
  },
});

export const CommentModel = mongoose.model<IComment>("Comment", commentSchema);
