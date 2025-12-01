import mongoose from "mongoose";
import Student from "../models/student.model.js";

const connectDb = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL || process.env.DB_URL;
        if (!mongoUrl) {
            throw new Error('MONGO_URL or DB_URL environment variable is not set');
        }
        
        const conn = await mongoose.connect(mongoUrl);
        console.log(`Connection established: ${conn.connection.host}`);
        
        // Fix: Drop the old email_1 index if it exists (students don't have email field)
        try {
            const studentCollection = conn.connection.db.collection('students');
            const indexes = await studentCollection.indexes();
            const emailIndex = indexes.find(idx => idx.name === 'email_1');
            if (emailIndex) {
                await studentCollection.dropIndex('email_1');
                console.log('✅ Dropped old email_1 index from students collection');
            }
        } catch (indexError) {
            // Index might not exist, which is fine
            if (indexError.code !== 27) { // 27 = IndexNotFound
                console.log('Note: Could not drop email_1 index:', indexError.message);
            }
        }
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        console.error('Please check your MONGO_URL environment variable');
        process.exit(1);
    }
};

export default connectDb;



