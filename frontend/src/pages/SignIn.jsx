import React, { useState, useContext } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { UserDataContext } from "../context/userContext";
import axios from "axios";

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { serverUrl, userData, setUserData } = useContext(UserDataContext);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("Attempting sign in..."); // Debug log
      
      let result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { withCredentials: true }
      );
      
      console.log("Sign in successful, result:", result.data); // Debug log
      
      setUserData(result.data);
      setLoading(false);
      
      // Add a small delay to ensure context updates
      setTimeout(() => {
        console.log("Navigating to search page..."); // Debug log
        navigate("/search");
      }, 100);

    } catch (err) {
      console.error("Sign-in failed:", err);
      
      // Check if the error has a response from the server
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        // Handle network errors or other unexpected errors
        setError("An unexpected error occurred. Please try again.");
      }
      
      setUserData(null);
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-[100vh] bg-cover flex justify-center items-center"
      style={{
        backgroundImage: "url('/search.jpg')",
      }}
    >
      <form
        className="w-[90%] h-[600px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col justify-center gap-[20px] px-[20px]"
        onSubmit={handleSignIn}
      >
        <h1 className="text-black text-[30px] font-semibold">
          Sign In to <span className="text-blue-200">Virtual Assistant</span>
        </h1>

        <input
          type="email"
          placeholder="Enter your Email"
          className="w-full h-[60px] outline-none border-2 border-white bg-transparent text-black placeholder:text-gray-300 px-[20px] py-[10px] rounded-full text-[18px]"
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <div className="w-full h-[60px] border-2 border-white bg-transparent text-black rounded-full text-[18px] relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-full rounded-full outline-none bg-transparent placeholder:text-gray-300 px-[20px] py-[10px]"
            required
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          />

          {!showPassword ? (
            <IoEye
              className="absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          ) : (
            <IoEyeOff
              className="absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer"
              onClick={() => setShowPassword(false)}
            />
          )}
        </div>

        {error && <p className="text-red-500 text-[16px] text-center">{error}</p>}

        <button
          type="submit"
          className="w-[150px] h-[60px] mt-[30px] mx-auto text-black font-semibold bg-gray-400 rounded-full text-[19px] hover:bg-gray-600 hover:text-white transition-all duration-300 cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <p className="text-white text-[18px] text-center">
          Want to create a new account?{" "}
          <span
            className="text-black cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}

export default SignIn;