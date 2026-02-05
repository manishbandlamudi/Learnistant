import axios from "axios";
import React, { createContext, useEffect, useState } from "react";

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
  const serverUrl = "http://localhost:8000";
  const [userData, setUserData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [selectImage, setSelectImage] = useState(null);

  const handleCurrentUser = async () => {
    try {
      let res = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true });
      setUserData(res.data); // ✅ because backend now sends direct user object
    } catch (err) {
      console.log("Could not fetch current user:", err);
      setUserData(null);
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value = {
    serverUrl,
    userData,
    setUserData,
    uploadFile,
    setUploadFile,
    previewImage,
    setPreviewImage,
    selectImage,
    setSelectImage,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;
