import mongoose from "mongoose";
import { IReact } from "../../Common/Interfaces/react.interface";

const reactSchema = new mongoose.Schema<IReact>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only like a post once
reactSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const ReactModel = mongoose.model<IReact>("React", reactSchema);
