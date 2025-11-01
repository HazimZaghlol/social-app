import { NextFunction, Request, Response } from "express";
import { PostRepository, ReactRepository } from "../../../DB/Repositories";
import { IRequest } from "../../../Common";
import { BadRequestException, NotFoundException } from "../../../Utils";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import mongoose from "mongoose";

class ReactService {
  private reactRepository: ReactRepository = new ReactRepository();
  private postRepository: PostRepository = new PostRepository();

  toggleReact = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as IRequest).loggedInUser.user._id;
      const { postId } = req.params;

      if (!postId) {
        throw new BadRequestException("Post ID is required");
      }

      const post = await this.postRepository.findDocumentById(new mongoose.Types.ObjectId(postId));

      if (!post) {
        throw new NotFoundException("Post not found");
      }

      if (post.isFrozen) {
        throw new BadRequestException("Cannot interact with a frozen post");
      }
      const { isLiked, count } = await this.reactRepository.toggleReact(userId.toString(), postId);

      return res.json(
        SuccessResponse(`Post ${isLiked ? "liked" : "unLiked"} successfully`, {
          isLiked,
          totalLikes: count,
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get react status and count for a post
  getReactStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as IRequest).loggedInUser.user._id;
      const { postId } = req.params;

      if (!postId) {
        throw new BadRequestException("Post ID is required");
      }

      const post = await this.postRepository.findDocumentById(new mongoose.Types.ObjectId(postId));
      if (!post) {
        throw new NotFoundException("Post not found");
      }

      const { isLiked, count } = await this.reactRepository.getReactStatus(userId.toString(), postId);

      return res.json(
        SuccessResponse("React status retrieved successfully", {
          isLiked,
          totalLikes: count,
        })
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new ReactService();
