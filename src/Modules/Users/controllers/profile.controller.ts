import { Router } from "express";
import profileService from "../Services/profile.service";
import { authenticate, multerMiddleware } from "../../../Middleware";

const profileController = Router();

profileController.post("/upload-profile-pic", authenticate, multerMiddleware().single("profilePicture"), profileService.uploadProfilePic);
profileController.post("/renew-sign-url", authenticate, profileService.renewSignUrl);
profileController.delete("/delete-account", authenticate, profileService.deleteAccount);
profileController.put("/update", authenticate, profileService.updateProfile);
profileController.patch("/update-password", authenticate, profileService.updatePassword);
profileController.patch("/update-email", authenticate, profileService.updateEmail);
profileController.post("/send-friend-request", authenticate, profileService.sendFriendShipRequest);
profileController.get("/list-friend-request", authenticate, profileService.listFriendShips);
profileController.patch("/response-friend-request", authenticate, profileService.responseFriendShipRequest);
profileController.post("/create-friend-group", authenticate, profileService.createFriendGroup);
profileController.delete("/unfriend/:friendId", authenticate, profileService.unfriendUser);
profileController.delete("/friend-request/:requestId", authenticate, profileService.deleteFriendRequest);
profileController.post("/block/:userId", authenticate, profileService.blockUser);
profileController.post("/unblock/:userId", authenticate, profileService.unblockUser);

export { profileController };
