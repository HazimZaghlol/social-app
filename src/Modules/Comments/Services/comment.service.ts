import { NextFunction, Request, Response } from "express";
import { IComment, IRequest, RoleEnum } from "../../../Common";
import { CommentRepository } from "../../../DB/Repositories/comment.repository";
import { PostRepository } from "../../../DB/Repositories/post.repositroy";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../../../Utils";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import mongoose, { Types } from "mongoose";

class CommentService {
  private commentRepository: CommentRepository = new CommentRepository();
  private postRepository: PostRepository = new PostRepository();

  // *************************************** Create Comment ***************************************
  createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as IRequest).loggedInUser.user._id;
      const { content, refId, onModel = "Post" } = req.body;

      if (!content) {
        throw new BadRequestException("Comment content is required");
      }

      // Check if reference (post or parent comment) exists and is not frozen
      if (onModel === "Post") {
        const post = await this.postRepository.findDocumentById(new Types.ObjectId(refId));
        if (!post) {
          throw new NotFoundException("Post not found");
        }
        if (post.isFrozen) {
          throw new BadRequestException("Cannot comment on a frozen post");
        }
        if (!post.allowComments) {
          throw new BadRequestException("Comments are disabled for this post");
        }
      } else {
        const parentComment = await this.commentRepository.findDocumentById(new Types.ObjectId(refId));
        if (!parentComment) {
          throw new NotFoundException("Parent comment not found");
        }
        if (parentComment.isFrozen) {
          throw new BadRequestException("Cannot reply to a frozen comment");
        }
      }

      const comment = await this.commentRepository.createNewDocument({
        content,
        refId: new Types.ObjectId(refId),
        ownerId: userId,
        onModel,
      });

      return res.status(201).json(SuccessResponse("Comment created successfully", { comment }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Update Comment ***************************************
  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const userId = (req as IRequest).loggedInUser.user._id;
      const { content } = req.body;

      if (!content) {
        throw new BadRequestException("Comment content is required");
      }

      const comment = await this.commentRepository.findDocumentById(new Types.ObjectId(commentId));
      if (!comment) {
        throw new NotFoundException("Comment not found");
      }

      // Check ownership or admin privilege
      if (comment.ownerId.toString() !== userId.toString() && (req as IRequest).loggedInUser.user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("You can only edit your own comments");
      }

      const updatedComment = await this.commentRepository.updateOneDocument({ _id: commentId }, { content });

      return res.json(SuccessResponse("Comment updated successfully", { comment: updatedComment }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Get Comment ***************************************
  getComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;

      const comment = await this.commentRepository.findDocumentById(new Types.ObjectId(commentId));
      await comment?.populate("ownerId", "firstname lastname profilePic");

      if (!comment) {
        throw new NotFoundException("Comment not found");
      }

      return res.json(SuccessResponse("Comment retrieved successfully", { comment }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Get Comment with Replies ***************************************
  getCommentWithReplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const { depth = 1 } = req.query;

      // Get the main comment
      const comment = await this.commentRepository.findDocumentById(new Types.ObjectId(commentId));
      await comment?.populate("ownerId", "firstname lastname profilePic");

      if (!comment) {
        throw new NotFoundException("Comment not found");
      }

      // Function to recursively get replies up to specified depth
      const getReplies = async (parentId: Types.ObjectId, currentDepth: number): Promise<IComment[]> => {
        if (currentDepth >= Number(depth)) return [];

        const replies = await this.commentRepository.findDocumentsByFilter({ refId: parentId, onModel: "Comment" });
        await Promise.all(replies.map((reply) => reply.populate("ownerId", "firstname lastname profilePic")));

        const repliesWithChildren = await Promise.all(
          replies.map(async (reply) => {
            const children = await getReplies(reply._id, currentDepth + 1);
            return {
              ...reply.toObject(),
              replies: children,
            };
          })
        );

        return repliesWithChildren;
      };

      const replies = await getReplies(comment._id, 0);

      return res.json(
        SuccessResponse("Comment and replies retrieved successfully", {
          comment: {
            ...comment.toObject(),
            replies,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Hard Delete Comment ***************************************
  hardDeleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const user = (req as IRequest).loggedInUser.user;
      const { deleteReplies = false } = req.query;

      const comment = await this.commentRepository.findDocumentById(new Types.ObjectId(commentId));
      if (!comment) {
        throw new NotFoundException("Comment not found");
      }

      // Check authorization
      if (comment.ownerId.toString() !== user._id.toString() && user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("Unauthorized to delete this comment");
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Delete replies if specified
        if (deleteReplies) {
          await this.commentRepository.deleteManyDocuments({
            $or: [{ _id: commentId }, { refId: commentId, onModel: "Comment" }],
          });
        } else {
          // Just delete the comment
          await this.commentRepository.deleteDocumentById(new Types.ObjectId(commentId));
        }

        await session.commitTransaction();
        return res.json(SuccessResponse(`Comment ${deleteReplies ? "and its replies " : ""}deleted successfully`));
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Freeze Comment ***************************************
  freezeComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const user = (req as IRequest).loggedInUser.user;

      const comment = await this.commentRepository.findDocumentById(new Types.ObjectId(commentId));
      if (!comment) {
        throw new NotFoundException("Comment not found");
      }

      // Only comment owner or admin can freeze the comment
      if (comment.ownerId.toString() !== user._id.toString() && user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("You don't have permission to freeze this comment");
      }

      // If comment is already frozen, return error
      if (comment.isFrozen) {
        throw new BadRequestException("Comment is already frozen");
      }

      const updatedComment = await this.commentRepository.updateOneDocument({ _id: commentId }, { isFrozen: true });

      return res.json(SuccessResponse("Comment frozen successfully", { comment: updatedComment }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Unfreeze Comment ***************************************
  unfreezeComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const user = (req as IRequest).loggedInUser.user;

      const comment = await this.commentRepository.findDocumentById(new Types.ObjectId(commentId));
      if (!comment) {
        throw new NotFoundException("Comment not found");
      }

      // Only comment owner or admin can unfreeze the comment
      if (comment.ownerId.toString() !== user._id.toString() && user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("You don't have permission to unfreeze this comment");
      }

      // If comment is not frozen, return error
      if (!comment.isFrozen) {
        throw new BadRequestException("Comment is not frozen");
      }

      const updatedComment = await this.commentRepository.updateOneDocument({ _id: commentId }, { isFrozen: false });

      return res.json(SuccessResponse("Comment unfrozen successfully", { comment: updatedComment }));
    } catch (error) {
      next(error);
    }
  };
}

export default new CommentService();
