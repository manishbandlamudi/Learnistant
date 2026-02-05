import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import SignIn from "./pages/SignIn.jsx";
import Customize from "./pages/Customize.jsx";
 
import Home from "./pages/Home.jsx";
import SearchPage from "./pages/Search.jsx";
import { useContext } from "react";
import { UserDataContext } from "./context/userContext.jsx";
import DSAHub from "./pages/DSAHub.jsx";
import ContactForm from "./pages/Contact.jsx";
import LearningDashboard from "./pages/Progress.jsx";
const App = () => {
  const { userData, loading } = useContext(UserDataContext);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-gradient-to-t from-black to-[#010131]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <h1 className="text-white text-xl">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Always redirect root to search */}
      <Route path="/" element={<Navigate to="/search" replace />} />

      {/* Auth routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/signin" element={<SignIn />} />

      {/* Flow pages */}
      <Route path="/search" element={<SearchPage />} />
      <Route path="/customize" element={<Customize />} />
      <Route path="/dsahub" element={<DSAHub/>}/>
      <Route path="/home" element={<Home />} />
      <Route path="/contact" element={<ContactForm/>}/>
      <Route path="/progress" element={<LearningDashboard/>}/>
      {/* Catch-all → redirect to search */}
      <Route path="*" element={<Navigate to="/search" replace />} />
    </Routes>
  );
};

export default App;
