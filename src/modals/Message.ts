import { model, Schema } from "mongoose";
import { IMessage } from "./type";

export const messageSchema = new Schema<IMessage>({
    conversationId: {type: Schema.Types.ObjectId, ref: "Conversation", required: true},
    senderId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    receiverId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    message: {type: String, required: true},
},{timestamps: true});

const Message = model<IMessage>("Message", messageSchema);

export default Message;