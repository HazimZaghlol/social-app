import { CommentRepository } from "./../../../DB/Repositories/comment.repository";
import { NextFunction, Request, Response } from "express";
import { UserModel } from "../../../DB/Models";
import { PostRepository, ReactRepository, UserRepository } from "../../../DB/Repositories";
import { FriendShipRepository } from "./../../../DB/Repositories/friendShip.repository";
import { FriedShipStatusEnum, IRequest, RoleEnum } from "../../../Common";
import mongoose, { Types } from "mongoose";
import { BadRequestException, NotFoundException, pagination, UnauthorizedException } from "../../../Utils";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";

class PostService {
  private postRepository: PostRepository = new PostRepository();
  private userRepo: UserRepository = new UserRepository(UserModel);
  private FriendShipRepository: FriendShipRepository = new FriendShipRepository();
  private reactRepository: ReactRepository = new ReactRepository();
  private CommentRepository: CommentRepository = new CommentRepository();

  // *************************************** create Post ***************************************
  addNewPost = async (req: Request, res: Response) => {
    const userId = (req as IRequest).loggedInUser.user._id;
    const { description, attachments, allowComments, tags } = req.body;
    const files = req.files as Express.Multer.File[];
    if (!description && (!files || files.length)) {
      throw new Error("Post must have either description or attachments");
    }

    let uniqueTags: Types.ObjectId[] = [];
    if (tags && Array.isArray(tags)) {
      const tagObjectIds = tags.map((tag) => new Types.ObjectId(tag));
      const validTags = await this.userRepo.findDocumentsByFilter({
        _id: { $in: tagObjectIds },
      });

      if (validTags.length !== tags.length) {
        throw new BadRequestException("One or more tags are invalid");
      }
      const friends = await this.FriendShipRepository.findDocumentsByFilter({
        status: FriedShipStatusEnum.ACCEPTED,
        $or: [
          { requestFormId: userId, requestToId: { $in: tagObjectIds } },
          { requestFormId: { $in: tagObjectIds }, requestToId: userId },
        ],
      });

      if (friends.length !== tags.length) {
        throw new BadRequestException("You can only tag your friends in posts");
      }

      uniqueTags = Array.from(new Set(tagObjectIds));
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

  // *************************************** list Post ***************************************
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
  // *************************************** get Post By Id ***************************************
  getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const userId = (req as IRequest).loggedInUser.user._id;

      // Validate postId format
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new BadRequestException("Invalid post ID format");
      }

      // Find the post and populate owner details
      const post = await this.postRepository.findOneDocument({ _id: new Types.ObjectId(postId) }, undefined, {
        populate: [
          {
            path: "ownerId",
            select: "firstname lastname email profilePic",
          },
          {
            path: "tags",
            select: "firstname lastname email profilePic",
          },
        ],
      });

      if (!post) {
        throw new NotFoundException("Post not found");
      }

      // Get basic counts
      const [commentCount, reactionCount] = await Promise.all([
        this.CommentRepository.countDocuments({ postId: new Types.ObjectId(postId) }),
        this.reactRepository.countDocuments({ postId: new Types.ObjectId(postId) }),
      ]);

      // Prepare the response data
      const postData = {
        ...post.toObject(),
        commentCount,
        reactionCount,
        isOwner: post.ownerId._id.toString() === userId.toString(),
        canComment: post.allowComments && !post.isFrozen,
      };

      return res.json(SuccessResponse("Post retrieved successfully", { post: postData }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Freeze Post ***************************************
  freezePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const userId = (req as IRequest).loggedInUser.user._id;
      const user = (req as IRequest).loggedInUser.user;

      // Check if user has admin role
      if (user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("Only administrators can freeze posts");
      }

      const post = await this.postRepository.findDocumentById(new Types.ObjectId(postId));
      if (!post) {
        throw new NotFoundException("Post not found");
      }

      if (post.isFrozen) {
        throw new BadRequestException("Post is already frozen");
      }

      const updatedPost = await this.postRepository.updateOneDocument(
        { _id: postId },
        {
          isFrozen: true,
          frozenAt: new Date(),
          frozenBy: userId,
        }
      );

      return res.json(SuccessResponse("Post frozen successfully", { post: updatedPost }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Unfreeze Post ***************************************
  unfreezePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const user = (req as IRequest).loggedInUser.user;

      // Check if user has admin role
      if (user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("Only administrators can unfreeze posts");
      }

      const post = await this.postRepository.findDocumentById(new Types.ObjectId(postId));
      if (!post) {
        throw new NotFoundException("Post not found");
      }

      if (!post.isFrozen) {
        throw new BadRequestException("Post is not frozen");
      }

      const updatedPost = await this.postRepository.updateOneDocument(
        { _id: postId },
        {
          isFrozen: false,
          frozenAt: undefined,
          frozenBy: undefined,
        }
      );

      return res.json(SuccessResponse("Post unfrozen successfully", { post: updatedPost }));
    } catch (error) {
      next(error);
    }
  };

  // *************************************** Hard Delete Post ***************************************
  hardDeletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const user = (req as IRequest).loggedInUser.user;

      // Check if user has admin role
      if (user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("Only administrators can hard delete posts");
      }

      const post = await this.postRepository.findDocumentById(new Types.ObjectId(postId));
      if (!post) {
        throw new NotFoundException("Post not found");
      }

      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Delete all comments associated with the post
        await this.CommentRepository.deleteManyDocuments({ postId: new Types.ObjectId(postId) });

        // Delete all reactions associated with the post
        await this.reactRepository.deleteManyDocuments({ postId: new Types.ObjectId(postId) });

        // Delete the post itself
        await this.postRepository.deleteDocumentById(new Types.ObjectId(postId));

        // Commit the transaction
        await session.commitTransaction();

        return res.json(SuccessResponse("Post and all associated data deleted successfully", null));
      } catch (error) {
        // If any operation fails, abort the transaction
        await session.abortTransaction();
        throw error;
      } finally {
        // End the session
        session.endSession();
      }
    } catch (error) {
      next(error);
    }
  };

  // *************************************** update Post ***************************************
  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const { description, allowComments, tags } = req.body;
      const files = req.files as Express.Multer.File[];
      const user = (req as IRequest).loggedInUser.user;

      const post = await this.postRepository.findDocumentById(new Types.ObjectId(postId));
      if (!post) {
        throw new NotFoundException("Post not found");
      }

      if (post.ownerId.toString() !== user._id.toString() && user.role !== RoleEnum.ADMIN) {
        throw new UnauthorizedException("You can only edit your own posts");
      }

      if (post.isFrozen) {
        throw new BadRequestException("Cannot update a frozen post");
      }

      let uniqueTags: Types.ObjectId[] = (post.tags as Types.ObjectId[]) || [];
      if (tags && Array.isArray(tags)) {
        const tagObjectIds = tags.map((tag) => new Types.ObjectId(tag));
        const validTags = await this.userRepo.findDocumentsByFilter({
          _id: { $in: tagObjectIds },
        });

        if (validTags.length !== tags.length) {
          throw new BadRequestException("One or more tags are invalid");
        }

        const friends = await this.FriendShipRepository.findDocumentsByFilter({
          status: FriedShipStatusEnum.ACCEPTED,
          $or: [
            { requestFormId: user._id, requestToId: { $in: tagObjectIds } },
            { requestFormId: { $in: tagObjectIds }, requestToId: user._id },
          ],
        });

        if (friends.length !== tags.length) {
          throw new BadRequestException("You can only tag your friends in posts");
        }

        uniqueTags = Array.from(new Set(tagObjectIds));
      }

      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (allowComments !== undefined) updateData.allowComments = allowComments;
      if (tags !== undefined) updateData.tags = uniqueTags;

      if (files && files.length > 0) {
        updateData.attachments = files.map((file) => file.path);
      }

      const updatedPost = await this.postRepository.updateOneDocument({ _id: postId }, updateData);

      return res.json(SuccessResponse("Post updated successfully", { post: updatedPost }));
    } catch (error) {
      next(error);
    }
  };
}
export default new PostService();
