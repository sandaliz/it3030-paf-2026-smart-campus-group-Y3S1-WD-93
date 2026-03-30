// Initialize admin user if not exists
db.users.updateOne(
    { email: "admin@campus.edu" },
    {
        $setOnInsert: {
            email: "admin@campus.edu",
            name: "System Administrator",
            role: "ADMIN",
            isActive: true,
            createdAt: new Date(),
            lastLoginAt: new Date()
        }
    },
    { upsert: true }
);

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "googleId": 1 });
db.users.createIndex({ "role": 1 });