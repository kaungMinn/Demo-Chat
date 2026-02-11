import { z } from "zod";

export const messageValidation = z.object({
    conversationId: z.string().optional(),
    senderId: z.string().min(1, "Sender ID is required"),
    receiverId: z.string().min(1, "Receiver ID is required"),
    message: z.string().min(1, "Message is required"),
});