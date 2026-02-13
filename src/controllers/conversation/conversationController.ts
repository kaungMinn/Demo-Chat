import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { dataUtils } from "../../utils/utils";
import Conversation from "../../modals/Conversation";

const getAdminConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user?._id;

        if (!adminId || !dataUtils.isValidObjectId(adminId)) {
            return res.status(StatusCodes.UNAUTHORIZED).json(dataUtils.responseData("error", "Unauthorized"));
        }

        // Fetch all conversations for this admin
        const conversations = await Conversation.find({ adminId })
            .populate("userId", "name displayName email") // Get customer details
            .sort({ updatedAt: -1 }); // Keep most recent chats at the top

        return res.status(StatusCodes.OK).json(
            dataUtils.responseData("success", "Admin conversations retrieved", conversations)
        );
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        next(error);
    }
};

export const conversationController = {
    getAdminConversations,
    // getUserConversations: ... (Similar logic but find { userId })
};