import { NextFunction, Request, Response } from "express";
import { ConversationType, FriedShipStatusEnum, IRequest, IUser } from "../../../Common";
import { UserRepository } from "../../../DB/Repositories/user.repository";
import { UserModel } from "../../../DB/Models";
import { BadRequestException, NotFoundException } from "../../../Utils/Errors/exceptions.utils";
import { HttpException } from "../../../Utils/Errors/http-exception.utils";
import mongoose from "mongoose";
import { SuccessResponse } from "../../../Utils/Response/response-helper.utils";
import { FriendShipRepository } from "../../../DB/Repositories/friendShip.repository";
import { ConversationRepository } from "../../../DB/Repositories";
import { S3ClientService } from "../../../Utils";

class ProfileService {
  private userRepo: UserRepository = new UserRepository(UserModel);
  private friendShipRepo = new FriendShipRepository();
  private ConversationRepository: ConversationRepository = new ConversationRepository();
  private s3Client = new S3ClientService();

  // *************************************** upload file ***************************************
  uploadProfilePic = async (req: Request, res: Response) => {
    const { file } = req;
    const userId = (req as IRequest).loggedInUser.user._id;
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const { key, url } = await this.s3Client.uploadFileOns3(file, `profile-pic/${userId}`);
    const updatedUser = await this.userRepo.updateOneDocument({ _id: userId }, { profilePic: url }, { new: true });
    if (!updatedUser) {
      throw new NotFoundException("User not found");
    }
    return res.json(SuccessResponse("File uploaded successfully", { key, url }));
  };

  // *************************************** renew signUrl ***************************************
  renewSignUrl = async (req: Request, res: Response) => {
    const user = (req as IRequest).loggedInUser.user;
    const { key, keyType }: { key: string; keyType: "profilePic" | "coverPic" } = req.body;
    if (user[keyType] !== key) {
      throw new BadRequestException("Key does not match user's stored key");
    }
    const signedUrl = await this.s3Client.getFileWithSignUrl(key, 60 * 60 * 24 * 7);
    return res.json(SuccessResponse("Signed URL generated successfully", { keyType, signedUrl }));
  };

  // *************************************** delete Account ***************************************
  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as IRequest).loggedInUser.user;
    const deletedDocument = await this.userRepo.deleteDocumentById(user._id);
    
    const deletedResponse = await this.s3Client.DeleteFileFromS3(deletedDocument?.profilePic || "");


    return res.json(SuccessResponse("Account deleted successfully", deletedResponse));
  };

  // *************************************** Update Profile ***************************************
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { firstname, lastname, password, gender, DOB, phoneNumber, age }: Partial<IUser> = req.body;
      const userId = (req as IRequest).loggedInUser.user._id;

      const existingUser = await this.userRepo.findDocumentById(userId);
      if (!existingUser) {
        throw new NotFoundException("User not found");
      }

      const updateData: Partial<IUser> = {};
      if (firstname) updateData.firstname = firstname;
      if (lastname) updateData.lastname = lastname;
      if (password) updateData.password = password;
      if (gender) updateData.gender = gender;
      if (DOB) updateData.DOB = new Date(DOB);
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (age) updateData.age = age;

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("No fields provided for update");
      }

      const updatedUser = await this.userRepo.updateOneDocument({ _id: userId }, updateData, { new: true, runValidators: true });

      if (!updatedUser) {
        throw new NotFoundException("Failed to update user");
      }

      return res.json(SuccessResponse<IUser>("Profile updated successfully", updatedUser));
    } catch (error: any) {
      if (error instanceof HttpException) {
        next(error);
      } else if (error.name === "ValidationError") {
        next(
          new BadRequestException("Validation Error", {
            errors: Object.values(error.errors).map((err: any) => err.message),
          })
        );
      } else {
        next(new HttpException("Error updating profile", 500));
      }
    }
  };

  // *************************************** send friend ship ***************************************
  sendFriendShipRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { friendId } = req.body;

      if (!friendId) {
        throw new BadRequestException("Friend ID is required");
      }

      const userId = (req as IRequest).loggedInUser.user._id;

      if (!mongoose.Types.ObjectId.isValid(friendId)) {
        throw new BadRequestException("Invalid friend ID format");
      }

      if (userId.toString() === friendId.toString()) {
        throw new BadRequestException("Cannot send friend request to yourself");
      }

      const friend = await this.userRepo.findDocumentById(friendId);
      if (!friend) {
        throw new NotFoundException("Friend not found");
      }

      await this.friendShipRepo.createNewDocument({
        requestFormId: userId,
        requestToId: friendId,
      });

      return res.json(SuccessResponse("Friend request sent successfully"));
    } catch (error: any) {
      if (error instanceof HttpException) {
        next(error);
      } else {
        next(new HttpException("Error sending friend request", 500));
      }
    }
  };

  // *************************************** list friend request ***************************************
  listFriendShips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as IRequest).loggedInUser.user._id;
      const { status } = req.query;

      const query =
        status === FriedShipStatusEnum.PENDING
          ? {
              requestToId: userId,
              status: FriedShipStatusEnum.PENDING,
            }
          : {
              $or: [{ requestFormId: userId }, { requestToId: userId }],
              status: status || FriedShipStatusEnum.ACCEPTED,
            };

      const friendships = await this.friendShipRepo.findDocumentsByFilter(query, undefined, {
        populate: [
          {
            path: "requestFormId",
            select: "firstname lastname email profilePic age gender",
          },
          {
            path: "requestToId",
            select: "firstname lastname email profilePic age gender",
          },
        ],
      });
      const groups = await this.ConversationRepository.findDocumentsByFilter({
        type: ConversationType.GROUP,
        members: { $in: [userId] },
      });
      return res.json(SuccessResponse("Friendships retrieved successfully", { friendships, groups }));
    } catch (error: any) {
      if (error instanceof HttpException) {
        next(error);
      } else {
        next(new HttpException("Error retrieving friendships", 500));
      }
    }
  };

  // *************************************** response friend request ***************************************
  responseFriendShipRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as IRequest).loggedInUser.user._id;
      const { requestId, status } = req.body;

      if (!requestId || !status) {
        throw new BadRequestException("Request ID and status are required");
      }

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        throw new BadRequestException("Invalid request ID format");
      }

      if (![FriedShipStatusEnum.ACCEPTED, FriedShipStatusEnum.REJECTED].includes(status)) {
        throw new BadRequestException("Status must be either 'accepted' or 'rejected'");
      }

      const friendRequest = await this.friendShipRepo.findOneDocument({
        _id: requestId,
        requestToId: userId,
        status: FriedShipStatusEnum.PENDING,
      });

      if (!friendRequest) {
        throw new NotFoundException("Friend request not found or you're not authorized to respond to it");
      }

      const updatedRequest = await this.friendShipRepo.updateOneDocument({ _id: requestId }, { status }, { new: true });

      if (!updatedRequest) {
        throw new HttpException("Failed to update friend request", 500);
      }

      const responseMessage = status === FriedShipStatusEnum.ACCEPTED ? "Friend request accepted successfully" : "Friend request rejected successfully";

      return res.json(SuccessResponse(responseMessage, updatedRequest));
    } catch (error: any) {
      if (error instanceof HttpException) {
        next(error);
      } else {
        next(new HttpException("Error processing friend request response", 500));
      }
    }
  };
  // *************************************** create friend group ***************************************
  createFriendGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { groupName, memberIds } = req.body;
      const userId = (req as IRequest).loggedInUser.user._id;

      if (!groupName || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        throw new BadRequestException("Group name and member IDs are required");
      }
      const members = await this.userRepo.findDocumentsByFilter({ _id: { $in: memberIds } });
      if (members.length !== memberIds.length) {
        throw new NotFoundException("One or more members not found");
      }
      const friendShip = await this.friendShipRepo.findDocumentsByFilter({
        $or: [
          { requestFormId: userId, requestToId: { $in: memberIds } },
          { requestFormId: { $in: memberIds }, requestToId: userId },
        ],
        status: FriedShipStatusEnum.ACCEPTED,
      });
      if (friendShip.length !== memberIds.length) {
        throw new BadRequestException("You can only add friends to the group");
      }
      const group = await this.ConversationRepository.createNewDocument({
        name: groupName,
        type: ConversationType.GROUP,
        members: [userId, ...memberIds],
      });
      return res.json(SuccessResponse("Friend group created successfully"));
    } catch (error: any) {
      if (error instanceof HttpException) {
        next(error);
      } else {
        next(new HttpException("Error creating friend group", 500));
      }
    }
  };
}

export default new ProfileService();
