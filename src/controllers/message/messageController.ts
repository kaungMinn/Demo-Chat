import { NextFunction, Request, Response } from "express"
import { messageValidation } from "../../validations/messageValidations"
import Conversation from "../../modals/Conversation";
import User from "../../modals/User";
import { StatusCodes } from "http-status-codes";
import Message from "../../modals/Message";
import mongoose from "mongoose";

const create = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
      const validatedData = messageValidation.safeParse(req.body);

      if(!validatedData.success){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: validatedData.error.flatten().fieldErrors
        })
      }
      
      let {conversationId, senderId, receiverId, message} = validatedData.data;

      const hasSender = await User.findById(senderId);

      const hasReceiver = await User.findById(receiverId);


       if(!hasSender || !hasReceiver){
        return res.status(StatusCodes.NOT_FOUND).json({
            message: "Conversation, sender or receiver not found"
        })
      }

      if(conversationId){
        const conversation = await Conversation.findById(conversationId);
        if(!conversation){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Conversation not found"
            })
        }
      }else if(!conversationId){
        const newConversation = await Conversation.create({userId: senderId, adminId: receiverId, lastMessage: message});
        conversationId = newConversation._id.toString();
      }

      const newMessage = await Message.create({conversationId, senderId, receiverId, message});

      await Conversation.findByIdAndUpdate(conversationId, {lastMessage: message});

      return res.status(StatusCodes.CREATED).json({
        message: "Message sent successfully",
        newMessage,
        conversationId
      });
    }catch(error){
        await session.abortTransaction();
        session.endSession();
        next(error)
    }
}

export const messageController = {create}