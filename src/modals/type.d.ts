import { Model, Schema,Document } from "mongoose";
import { z } from "zod";
import { nodeValidation } from "../validations/nodeValidations";

export type Roles = {
    user: number;
    editor?: number;
    admin?: number;
};

export interface IUser extends Document {
    name: string;
    displayName: string;
    email: string;
    isOnline: boolean;
    connectionStatus: 'disconnected' | 'connecting' | 'connected';
    lastSeen: Date;
    roles: Roles;
    password: string;
    refreshToken?: string;
}

export interface IConversation extends Document {
    userId: Schema.Types.ObjectId;
    adminId: Schema.Types.ObjectId;
    unreadCount?: number;
    totalMessages?: number;
    lastMessage?: string;
}

export interface IMessage extends Document {
    conversationId: Schema.Types.ObjectId;
    senderId: Schema.Types.ObjectId;
    receiverId: Schema.Types.ObjectId;
    message: string;   
}

export type UserModal = Model<IUser>
