import { Router } from "express";
import { authenticate, multerMiddleware } from "../../../Middleware";
import postService from "../Services/post.service";

const postController = Router();

postController.post("/create", authenticate, multerMiddleware().array("attachments"), postService.addNewPost);
postController.get("/:postId", authenticate, postService.getPostById);
postController.patch("/:postId", authenticate, multerMiddleware().array("attachments"), postService.updatePost);
postController.get("/", authenticate, postService.listHomePosts);
postController.patch("/:postId/freeze", authenticate, postService.freezePost);
postController.patch("/:postId/unfreeze", authenticate, postService.unfreezePost);
postController.delete("/:postId/hard-delete", authenticate, postService.hardDeletePost);

export { postController };
