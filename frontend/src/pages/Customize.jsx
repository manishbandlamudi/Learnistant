import React, { useRef, useContext } from 'react';
import Card from '../components/Card';
import { RiImageAddLine } from 'react-icons/ri';
import { UserDataContext } from '../context/userContext';
import { useNavigate } from 'react-router-dom';
import { IoMdArrowRoundBack } from "react-icons/io";

const Customize = () => {
  const {
    uploadFile, setUploadFile,
    previewImage, setPreviewImage,
    selectImage, setSelectImage
  } = useContext(UserDataContext);

  const navigate = useNavigate();
  const inputImage = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      setUploadFile(file); // Save file
      setSelectImage("input"); // Mark as custom upload
      
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCardSelect = (imagePath) => {
    setSelectImage(imagePath);
    setUploadFile(null); // Clear any uploaded file
    setPreviewImage(null); // Clear preview
  };

  const handleCustomImageClick = () => {
    inputImage.current.click();
    setSelectImage("input");
  };

  return (
    <div className='w-full min-h-screen bg-gradient-to-t from-black to-[#030353] flex flex-col justify-center items-center p-4'>
      <div className='w-full max-w-4xl flex flex-col items-center gap-10'>
        <IoMdArrowRoundBack
          className='absolute top-6 left-6 text-white cursor-pointer w-7 h-7 hover:text-blue-300 transition-colors duration-200'
          onClick={() => navigate("/search")}
        />

        <h1 className='text-white text-3xl md:text-4xl text-center font-semibold'>
          Select Your <span className='text-blue-300'>Assistant Image</span>
        </h1>

        <div className='w-full flex justify-center items-center flex-wrap gap-4'>
          {/* Pre-defined assistant images */}
          <div onClick={() => handleCardSelect("/image1.png")}>
            <Card image="/boy.jpg" isSelected={selectImage === "/image1.png"} />
          </div>
          <div onClick={() => handleCardSelect("/image2.jpg")}>
            <Card image="/girl.jpg" isSelected={selectImage === "/image2.jpg"} />
          </div>
           

          
        </div>

        {selectImage && (
          <div className="flex flex-col items-center gap-4">
             
            <button
              className="w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-lg hover:bg-blue-400 hover:text-white transition-all duration-300 cursor-pointer flex items-center justify-center"
              onClick={() => navigate('/home')}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customize;