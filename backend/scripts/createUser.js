const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Create a user
const createUser = async (username, password) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log(`User '${username}' already exists`);
            process.exit(0);
        }

        // Create new user
        const user = new User({ username, password });
        await user.save();
        
        console.log(`User '${username}' created successfully!`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};

// Get username and password from command line arguments
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.log('Usage: node createUser.js <username> <password>');
    console.log('Example: node createUser.js admin admin123');
    process.exit(1);
}

createUser(username, password);
