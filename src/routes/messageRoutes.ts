import { Router } from "express";
import { messageController } from "../controllers/message/messageController";

export const messageRouter = Router();

messageRouter.route("/").post(messageController.create);
messageRouter.route("/:conversationId").get(messageController.get);