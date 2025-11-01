import { IComment } from "../../Common/Interfaces/comments.interface";
import { CommentModel } from "../Models/comments.model";
import { BaseRepository } from "./base.repository";

export class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(CommentModel);
  }
}
