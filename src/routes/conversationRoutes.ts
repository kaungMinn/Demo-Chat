import { Router } from "express";
import { conversationController } from "../controllers/conversation/conversationController";


export const conversationRouter = Router();

conversationRouter.route("/admin").get(conversationController.getAdminConversations);
conversationRouter.route("/user").get(conversationController.getUserConversations);