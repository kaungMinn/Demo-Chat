import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { dataUtils } from "../../utils/utils";
import Conversation from "../../modals/Conversation";
import User from "../../modals/User";
import { userConstants } from "../../constants/userConstants";

const getUserConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        if (!userId || !dataUtils.isValidObjectId(userId)) {
            return res.status(StatusCodes.UNAUTHORIZED).json(dataUtils.responseData("error", "Unauthorized"));
        }

        // 1. Find the Admin (Assuming there is only one or you want the first one)
        const admin = await User.findOne({ "roles.admin": { $exists: true } });

        if (!admin) {
            return res.status(StatusCodes.NOT_FOUND).json(dataUtils.responseData("error", "Admin not found"));
        }

        // 2. Find the specific conversation between this User and this Admin
        // We use the $and operator to ensure BOTH parties are in the document
        const conversation = await Conversation.findOneAndUpdate(
            { userId, adminId: admin._id },
            { userId, adminId: admin._id },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
            .populate('userId', 'displayName email avatar')
            .populate('adminId', 'displayName email avatar')
            .populate('lastMessage');

        return res.status(StatusCodes.OK).json(
            dataUtils.responseData("success", "Conversations fetched", [conversation])
        );

    } catch (error) {
        next(error);
    }
};

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

        res.status(StatusCodes.OK).json(
            dataUtils.responseData("success", "Admin conversations retrieved", conversations)
        );
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        next(error);
    }
};

export const conversationController = {
    getAdminConversations,
    getUserConversations
};