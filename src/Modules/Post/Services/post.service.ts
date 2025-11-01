import { NextFunction, Request, Response } from "express";
import { UserModel } from "../../../DB/Models";
import { PostRepository, UserRepository } from "../../../DB/Repositories";
import { FriendShipRepository } from "./../../../DB/Repositories/friendShip.repository";
import { FriedShipStatusEnum, IRequest } from "../../../Common";
import { Types } from "mongoose";
import { pagination } from "../../../Utils";


class PostService {
  private postRepository: PostRepository = new PostRepository();
  private userRepo: UserRepository = new UserRepository(UserModel);
  private FriendShipRepository: FriendShipRepository = new FriendShipRepository();

  addNewPost = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as IRequest).loggedInUser.user._id;
    const { description, attachments, allowComments, tags } = req.body;
    const files = req.files as Express.Multer.File[];
    if (!description && (!files || files.length)) {
      throw new Error("Post must have either description or attachments");
    }

    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      const validTags = await this.userRepo.findDocumentsByFilter({ _id: { $in: tags } });
      if (validTags.length !== tags.length) {
        throw new Error("One or more tags are invalid");
      }
      const friends = await this.FriendShipRepository.findDocumentsByFilter({
        status: FriedShipStatusEnum.ACCEPTED,
        $or: [
          { requestFormId: userId, requestToId: { $in: tags } },
          { requestFormId: { $in: tags }, requestToId: userId },
        ],
      });
      if (friends.length !== tags.length) {
        throw new Error("You can only tag your friends in posts");
      }
      uniqueTags = Array.from(new Set(tags));
    }

    const post = await this.postRepository.createNewDocument({
      description,
      attachments: files ? files.map((file) => file.path) : [],
      ownerId: userId,
      allowComments,
      tags: uniqueTags,
    });
    res.status(201).json({ message: "Post created successfully", post });
  };

  listHomePosts = async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const { limit: currentLimit, skip } = pagination({ page: Number(page), limit: Number(limit) });
    const posts = await this.postRepository.postPaginate(
      {},
      {
        limit: currentLimit,
        page: Number(page),
      }
    );
    return res.status(200).json({
      message: "success",
      data: { posts },
    });
  };
}
export default new PostService();
