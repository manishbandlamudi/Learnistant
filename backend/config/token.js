// In token.js

import jwt from "jsonwebtoken"; // ✅ Corrected import

const gentoken = (userId) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "15d",
    });
    return token;
  } catch (error) {
    throw new Error("Error generating token");
  }
};

export default gentoken;