import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../modals/Message';
import Conversation from '../modals/Conversation';
import { dataUtils } from '../utils/utils';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}

const onlineUsers = new Map<string, string>(); // Map<userId, socketId>

export const initializeSocketHandlers = (io: Server) => {
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log('User connected:', socket.id);

        // Authenticate socket connection
        socket.on('authenticate', async (token: string) => {
            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'fallback-secret') as any;
                socket.userId = decoded.userInfo._id;
                socket.user = decoded.userInfo;
                // 1. Add to online map
                onlineUsers.set(decoded?.userInfo._id, socket.id);

                // 2. Broadcast to everyone that this user is online
                io.emit('user_status_changed', { userId:decoded.userInfo._id, status: 'online' });
                
                // 3. Optional: Send the list of currently online users to the person who just connected
                socket.emit('get_online_users', Array.from(onlineUsers.keys()));

                console.log('Socket authenticated for user:', decoded.userInfo._id);
            } catch (error) {
                console.error('Socket authentication failed:', error);
                socket.emit('auth_error', { message: 'Authentication failed' });
                socket.disconnect();
            }
        });

        // Join conversation room
        socket.on('join_conversation', async (conversationId: string) => {
            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            // Verify user is part of this conversation
            const conversation = await Conversation.findOne({
                _id: conversationId,
                $or: [
                    { userId: socket.userId },
                    { adminId: socket.userId }
                ]
            });

            if (!conversation) {
                socket.emit('error', { message: 'Conversation not found or access denied' });
                return;
            }

            // Join the conversation room
            socket.join(conversationId);
            console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        });

        // Leave conversation room
        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(conversationId);
            console.log(`User ${socket.userId} left conversation ${conversationId}`);
        });

        // Send message
        socket.on('send_message', async (messageData: {
            conversationId: string;
            message: string;
            senderId: string;
            createdAt?: string;
        }) => {
            try {
                if (!socket.userId || socket.userId !== messageData.senderId) {
                    socket.emit('error', { message: 'Unauthorized' });
                    return;
                }

                const { conversationId, message, senderId } = messageData;

                // Verify conversation exists and user is part of it
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    $or: [
                        { userId: senderId },
                        { adminId: senderId }
                    ]
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found or access denied' });
                    return;
                }

                // Create message in database
                const newMessage = await Message.create({
                    conversationId,
                    senderId,
                    receiverId: conversation.userId.toString() === senderId ? conversation.adminId : conversation.userId,
                    message,
                    createdAt: new Date()
                });

                // Update conversation's last message
                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: message,
                    $inc: { totalMessages: 1, unreadCount: 1 },
                    updatedAt: new Date()
                });

                // Populate message with sender details
                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('senderId', 'displayName email')
                    .exec();

                // Broadcast to all users in the conversation room
                io.to(conversationId).emit('new_message', populatedMessage);
                
                console.log(`Message sent in conversation ${conversationId} by ${senderId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicators
        socket.on('typing', (data: { conversationId: string; userId: string }) => {
            if (socket.userId === data.userId) {
                socket.to(data.conversationId).emit('user_typing', {
                    userId: data.userId,
                    conversationId: data.conversationId
                });
            }
        });

        socket.on('stop_typing', (data: { conversationId: string; userId: string }) => {
            if (socket.userId === data.userId) {
                socket.to(data.conversationId).emit('user_stop_typing', {
                    userId: data.userId,
                    conversationId: data.conversationId
                });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (socket.userId) {
                // 4. Remove from online map
                onlineUsers.delete(socket.userId);

                // 5. Broadcast departure
                io.emit('user_status_changed', { userId: socket.userId, status: 'offline' });
                console.log('User disconnected:', socket.userId);
            }
        });
    });
};
