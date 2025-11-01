import { FilterQuery, PaginateOptions } from "mongoose";
import { IPost } from "../../Common";
import { PostModel } from "../Models/post.model";
import { BaseRepository } from "./base.repository";

export class PostRepository extends BaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }

  async postPaginate(filter?: FilterQuery<IPost>, options?: PaginateOptions) {
    return await PostModel.paginate(filter, options);
  }
}
