import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// console.log("Mongo", process.env.MONGO_URI);
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 50000,
            connectTimeoutMS: 50000,
        });
        // console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;