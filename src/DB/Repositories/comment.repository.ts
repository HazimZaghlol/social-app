import { IComment } from "../../Common/Interfaces/comments.interface";
import { CommentModel } from "../Models/comments.model";
import { BaseRepository } from "./base.repository";

export class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(CommentModel);
  }

  async countDocuments(filter: any): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  async getCommentsByPostId(postId: string, options?: any) {
    return await this.model.find({ postId }).populate("userId", "firstname lastname profilePic").sort({ createdAt: -1 }).exec();
  }
}
