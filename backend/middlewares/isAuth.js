import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  console.log("--- Running isAuth Middleware ---");
  try {
    const token = req.cookies.token;
    console.log("Token from cookie:", token);

    if (!token) {
      console.log("Token not found, sending 400 error.");
      return res.status(400).json({ message: "Token not found" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.userId; // ✅ match gentoken payload
    console.log("Token verified successfully for user:", req.userId);

    next();
  } catch (error) {
    console.error("isAuth Error:", error.message);
    return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
};

export default isAuth;
