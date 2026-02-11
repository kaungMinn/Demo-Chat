import z from "zod";

export const conversationValidation = z.object({
    userId: z.string().min(1, {message: "User ID is required"}),
    adminId: z.string().min(1, {message: "Admin ID is required"}),
    unreadCount: z.number().optional(),
    lastMessage: z.string().optional(),
});

