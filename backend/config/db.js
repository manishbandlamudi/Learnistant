import mongoose from "mongoose";
const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
             console.log("MongoDB connected");
         
        
    }catch(error){
        console.log("Error connecting to MongoDB:",error); 
    }
};

export default connectDb;
