import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    // 1. Create a simple MongoDB Memory Server instance (without replica set)
    mongo = await MongoMemoryServer.create();
    
    // 2. Get the URI
    const uri = mongo.getUri();
    
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    // 3. Connect with specific options
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
    });

    // 4. Wait for connection to be ready
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 10; // 10 seconds max wait
    
    while (!isReady && attempts < maxAttempts) {
        try {
            const db = mongoose.connection.db;
            if (db) {
                await db.admin().command({ ping: 1 });
                isReady = true;
                console.log('✅ MongoDB is ready');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
    }
    
    if (!isReady) {
        throw new Error('MongoDB failed to initialize after 10 seconds');
    }
}, 60000); // 1 minute timeout

beforeEach(async () => {
    const db = mongoose.connection.db;
    if (db) {
        const collections = await db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
    // BANKER'S TIP: Re-sync indexes so your unique constraints work!
    await Promise.all(
        Object.values(mongoose.models).map((model) => model.syncIndexes())
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
        await mongo.stop();
    }
});