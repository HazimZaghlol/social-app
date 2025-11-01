import mongoose, { PaginateModel } from "mongoose";
import { IPost } from "../../Common";
import mongoosePaginate from "mongoose-paginate-v2";

const postSchema = new mongoose.Schema<IPost>({
  description: String,
  attachments: [{ type: String }],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  allowComments: { type: Boolean, default: true },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

postSchema.plugin(mongoosePaginate);

export const PostModel = mongoose.model<IPost, PaginateModel<IPost>>("Post", postSchema);
