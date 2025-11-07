import mongoose from "mongoose";

const connectDb = async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log(`connnection established: ${conn.connection.host}`)
    } catch (error) {
        console.log(`error in connection to mongo ${error.message}`)
        
    }
}

export default connectDb



