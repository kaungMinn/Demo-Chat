import mongoose from "mongoose";
import { z } from "zod";
import { dataUtils } from "../utils/utils";


export const messageValidation = z.object({
    conversationId: z.string().refine((value) => {
        if(value){
            return dataUtils.isValidObjectId(value);
        }
        return true;
    }, {
        message: "Invalid conversation ID format"
    }).optional(),
    senderId: z.string().refine((value) => {
        if(value){
            return dataUtils.isValidObjectId(value);
        }
        return true;
    }, {
        message: "Invalid sender ID format"
    }).optional(),
    receiverId: z.string().min(1, "Receiver ID is required").refine((value) => {
        return dataUtils.isValidObjectId(value);
    }, {
        message: "Invalid receiver ID format"
    }),
    message: z.string().min(1, "Message is required").default(""),
    roles: z.array(z.number()).min(1, "Role is required"),
});

// TypeScript type inference from schema
export type MessageValidationType = z.infer<typeof messageValidation>;

