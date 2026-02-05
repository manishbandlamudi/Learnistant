import React from 'react'
import { useContext } from 'react';
import { UserDataContext } from '../context/userContext.jsx';

const Card = ({image}) => {
    const { serverUrl ,
    userData,
    setuserData ,
    uploadFile, setUploadFile,
    previewImage, setPreviewImage,
    selectImage, setSelectImage
  } = useContext(UserDataContext);
  return (
    <div className={`w-[70px] h-[140px]  lg:w-[200px] lg:h-[300px] bg-[#030326] border-2 border-[#0000ff66] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer hover:border-4 hover:border-white ${selectImage === image ? 'border-4 border-white shadow-2xl shadow-blue-950' : null}`} onClick={() => {setSelectImage(image); setPreviewImage(null); setUploadFile(null);}}>
      <img src={image}  className='h-full w-full object-cover ' />
    </div>
  )
}

export default Card
