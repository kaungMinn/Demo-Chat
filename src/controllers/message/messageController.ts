import { NextFunction, Request, Response } from "express"
import { messageValidation } from "../../validations/messageValidations"
import Conversation from "../../modals/Conversation";
import User from "../../modals/User";
import { StatusCodes } from "http-status-codes";
import Message from "../../modals/Message";
import mongoose from "mongoose";
import { dataUtils } from "../../utils/utils";
import { userConstants } from "../../constants/userConstants";

const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id;

    // 1. Get pagination params from query (e.g., /api/messages/:id?page=1&limit=20)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "User not authenticated"
      });
    }

    if (!dataUtils.isObjectId(conversationId)) {
      return res.status(StatusCodes.BAD_REQUEST).json(dataUtils.responseData("error", "Invalid conversation ID format"));
    }

    // 2. Fetch messages and total count in parallel (Performance win!)
    const [messages, totalMessages] = await Promise.all([
      Message.find({
        conversationId,
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
      .sort({ createdAt: -1 }) // Sort by newest first for chat feel
      .skip(skip)
      .limit(limit),
      
      Message.countDocuments({
        conversationId,
        $or: [{ senderId: userId }, { receiverId: userId }]
      })
    ]);

    // 3. Return data with pagination metadata
    return res.status(StatusCodes.OK).json(dataUtils.responseData(
      "success", 
      "Messages retrieved successfully", 
      {
        messages: messages.reverse(), // Reverse back to chronological for the UI
        pagination: {
          totalMessages,
          currentPage: page,
          totalPages: Math.ceil(totalMessages / limit),
          hasNextPage: skip + messages.length < totalMessages
        }
      }
    ));
    
  } catch (error) {
    console.error("Catch Error:", error);
    next(error);
  }
}

const create = async (req: Request, res: Response, next: NextFunction) => {
    // Use transactions only if not in test environment (requires replica set)
    const useTransactions = process.env.NODE_ENV !== 'test';
    let session: any = null;

    if (useTransactions) {
        session = await mongoose.startSession();
        session.startTransaction();
    }

    const endSession = async () => {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
    }

    try{
      const userData = req.user;
      const {_id: senderId, roles} = userData || { _id: "", roles: [] };

      const requestData = {...req.body, senderId, roles};
      const validatedData = messageValidation.safeParse(requestData);

      if(!validatedData.success){
        await endSession();
        return res.status(StatusCodes.BAD_REQUEST).json(dataUtils.responseData("error", "Invalid request data", validatedData.error.flatten().fieldErrors));
      }
      
      let {conversationId, receiverId, message, roles: validatedRoles} = validatedData.data;

      const hasSender = await User.findById(senderId).session(session);

      const hasReceiver = await User.findById(receiverId).session(session);

       if(!hasSender || !hasReceiver){
        await endSession();
        return res.status(StatusCodes.NOT_FOUND).json(dataUtils.responseData("error", "Conversation, sender or receiver not found", null));
      }

      // One condition left -> Check if conversation is valid via sender and receivers
      if(conversationId){
        const conversation = await Conversation.findOne({
          _id: conversationId,
          $or: [
            { userId: senderId },
            { adminId: senderId }
          ]
        }).session(session);
        
        if(!conversation){
            await endSession();
            return res.status(StatusCodes.NOT_FOUND).json(dataUtils.responseData("error", "Conversation not found or access denied", null));
        }
      }else{
         // This is the ONE ATOMIC STEP to find or create the pair
    const conversation = await Conversation.findOneAndUpdate(
        {
            $or: [
                { userId: senderId, adminId: receiverId },
                { userId: receiverId, adminId: senderId }
            ]
        },
        { 
            // Only set these if creating a NEW document
            $setOnInsert: { 
                userId: validatedRoles.includes(userConstants.USER) ? receiverId : senderId, 
                adminId: validatedRoles.includes(userConstants.USER) ? senderId : receiverId,
                lastMessage: message 
            } 
        },
        { 
            upsert: true, // Create if not found
            new: true,    // Return the new/found doc
            session       // Keep it in the transaction
        }
    );
    conversationId = conversation._id.toString();
    }

      const newMessage = await Message.create([{
        conversationId, 
        senderId, 
        receiverId, 
        message
      }], {session});

      // 4. Update the Conversation's lastMessage (Crucial Step)
        // We also increment an unreadCount if you have one!
        await Conversation.findByIdAndUpdate(
            conversationId,
            { 
                lastMessage: message,
                $inc: { 
                    totalMessages: 1, 
                    unreadCount: 1 // Only increment this if the sender is NOT the one viewing it
                },
                updatedAt: new Date() // Forces the conversation to the top of the list
            },
            { session }
        );

      if (useTransactions) {
          await session.commitTransaction();
      }

      return res.status(StatusCodes.CREATED).json(dataUtils.responseData("success", "Message sent successfully", {
        newMessage: newMessage[0],
        conversationId
      }));
    }catch(error){
        if (useTransactions && session) {
            await session.abortTransaction();
        }
        console.log("error", error);
        next(error)
    }finally{
      if (session) {
          session.endSession();
      }
    }
}

export const messageController = {create, get}