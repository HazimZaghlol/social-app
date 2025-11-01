import { Router } from "express";
import { authenticate } from "../../../Middleware";
import commentService from "../Services/comment.service";

const commentController = Router();

// Create new comment
commentController.post("/create", authenticate, commentService.createComment);

// Update comment
commentController.patch("/:commentId", authenticate, commentService.updateComment);

// Get single comment
commentController.get("/:commentId", authenticate, commentService.getComment);

// Get comment with replies
commentController.get("/:commentId/replies", authenticate, commentService.getCommentWithReplies);

// Hard delete comment
commentController.delete("/:commentId", authenticate, commentService.hardDeleteComment);

// Freeze comment
commentController.post("/:commentId/freeze", authenticate, commentService.freezeComment);

// Unfreeze comment
commentController.post("/:commentId/unfreeze", authenticate, commentService.unfreezeComment);

export { commentController };
