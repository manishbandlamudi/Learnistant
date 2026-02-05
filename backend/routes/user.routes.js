 
import express from 'express';
 
import {   getCurrentUser, updateUser } from '../controller/user.controller.js';
import isAuth from '../middlewares/isAuth.js'; 
import upload from '../middlewares/multer.js';
const userRouter=express.Router();

userRouter.get('/current',isAuth, getCurrentUser)
 
userRouter.post('/update',isAuth,upload.single("assistantImage"), updateUser)
// The test code with isAuth temporarily disabled
 
export default userRouter;
