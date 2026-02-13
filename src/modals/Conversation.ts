import { model, Schema } from "mongoose";
import { IConversation } from "./type";

const conversationSchema = new Schema<IConversation>({
    userId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    adminId: {type: Schema.Types.ObjectId, ref: "User", required: true},
    unreadCount: {type: Number, default: 0},
    totalMessages: {type: Number, default: 0},
    lastMessage: {type: String, default: ""},
},{timestamps: true});

const Conversation = model<IConversation>("Conversation", conversationSchema);

export default Conversation;