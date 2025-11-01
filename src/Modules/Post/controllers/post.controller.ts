import { Router } from "express";
import { authenticate, multerMiddleware } from "../../../Middleware";
import postService from "../Services/post.service";

const postController = Router();

// Create post
postController.post("/create", authenticate, multerMiddleware().single("profilePicture"), postService.addNewPost);

// Update post

// Delete post

// Get single post

// Get all posts (with pagination)

// Get user's posts

// Toggle comments permission

export { postController };
