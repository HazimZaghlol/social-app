import { FilterQuery, Types } from "mongoose";
import { IReact } from "../../Common/Interfaces/react.interface";
import { ReactModel } from "../Models/react.model";
import { BaseRepository } from "./base.repository";

export class ReactRepository extends BaseRepository<IReact> {
  constructor() {
    super(ReactModel);
  }

  async getReactCount(filter: FilterQuery<IReact>): Promise<number> {
    return await ReactModel.countDocuments(filter);
  }

  async toggleReact(userId: string, postId: string): Promise<{ isLiked: boolean; count: number }> {
    const existingReact = await this.findOneDocument({ userId, postId });

    if (existingReact) {
      await this.deleteOneDocument({ userId, postId });
      const count = await this.getReactCount({ postId });
      return { isLiked: false, count };
    } else {
      await this.createNewDocument({ userId: new Types.ObjectId(userId), postId: new Types.ObjectId(postId) });
      const count = await this.getReactCount({ postId });
      return { isLiked: true, count };
    }
  }

  async getReactStatus(userId: string, postId: string): Promise<{ isLiked: boolean; count: number }> {
    const [existingReact, count] = await Promise.all([this.findOneDocument({ userId, postId }), this.getReactCount({ postId })]);

    return {
      isLiked: !!existingReact,
      count,
    };
  }

  async countDocuments(filter: any): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  async getReactsByPostId(postId: string) {
    return await this.model.find({ postId }).populate("userId", "firstname lastname profilePic").sort({ createdAt: -1 }).exec();
  }
}
