import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDb from "./config/db.js";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.routes.js";
import vapiRouter from "./routes/vapi.route.js";
import searchRouter from "./routes/search.route.js";
import questionRouter from "./routes/question.route.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/vapi", vapiRouter);
app.use("/api/search", searchRouter);
app.use("/api/questions", questionRouter);

app.listen(PORT, () => {
  connectDb();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
