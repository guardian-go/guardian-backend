import mongoose from "mongoose";

const connectDb = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || process.env.DB_URL;
        if (!mongoUrl) {
            throw new Error('MONGO_URL or DB_URL environment variable is not set');
        }
        
        const conn = await mongoose.connect(mongoUrl);
        console.log(`Connection established: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error in connection to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDb;



