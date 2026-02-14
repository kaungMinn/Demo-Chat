import request from 'supertest';
import { app } from '../src/app';
import Conversation from '../src/modals/Conversation';
import User from '../src/modals/User';
import mongoose from 'mongoose';

describe('Sentinel Message Controller', () => {
    const mockUserId = new mongoose.Types.ObjectId().toString();
    const mockAdminId = new mongoose.Types.ObjectId().toString();

    it('should maintain a single conversation when roles flip (User vs Admin)', async () => {
        // Create mock users first
        await User.create({
            _id: mockUserId,
            name: 'testuser',
            displayName: 'Test User',
            email: 'user@test.com',
            password: 'password123',
            roles: { user: 2001 }
        });

        await User.create({
            _id: mockAdminId,
            name: 'testadmin',
            displayName: 'Test Admin',
            email: 'admin@test.com',
            password: 'password123',
            roles: { admin: 2003 }
        });

        // 1. First message from User to Admin
        const res1 = await request(app)
            .post('/bleep/v1/messages')
            .set('user', JSON.stringify({ _id: mockUserId, roles: [2001] }))
            .send({
                receiverId: mockAdminId,
                message: "Help me!",
                roles: [2001]
            });

        // 2. Second message from Admin to User (No conversationId provided)
        const res2 = await request(app)
            .post('/bleep/v1/messages')
            .set('user', JSON.stringify({ _id: mockAdminId, roles: [2003] }))
            .send({
                receiverId: mockUserId,
                message: "I am here to help.",
                roles: [2003]
            });

        // THE BANK TEST: Both must have the same conversationId
        expect(res1.body.details.conversationId).toBe(res2.body.details.conversationId);

        // Verify that only ONE conversation exists in the DB
        const count = await Conversation.countDocuments();
        expect(count).toBe(1);

        // Verify columns are correct (User is User, Admin is Admin)
        const conv = await Conversation.findOne();
        expect(conv?.userId.toString()).toBe(mockUserId);
        expect(conv?.adminId.toString()).toBe(mockAdminId);
    });
});