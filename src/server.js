import express from "express";
import dotenv from "dotenv";
import connectDb from "./db/database.js";

dotenv.config();


const app = express();

const PORT = process.env.PORT || 5000


app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`)
    connectDb()
})