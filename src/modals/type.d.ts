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
    lastSeen: Date;
    roles: Roles;
    password: string;
    refreshToken?: string;
}

export interface IConversation extends Document {
    userId: Schema.Types.ObjectId;
    adminId: Schema.Types.ObjectId;
    unreadCount?: number;
    lastMessage?: string;
}

export interface IMessage extends Document {
    conversationId: Schema.Types.ObjectId;
    senderId: Schema.Types.ObjectId;
    receiverId: Schema.Types.ObjectId;
    message: string;   
}


export interface INode extends Document {
    _id: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    name: string;
    displayName: string;
    desc: string;
    lat: number;
    lon: number;
    image: string;
}


// export type INode = z.infer<typeof nodeValidation>


export type UserModal = Model<IUser>
export type NodeModal = Model<INode>