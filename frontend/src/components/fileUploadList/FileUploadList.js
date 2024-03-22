import React, { useState, useRef } from "react";
import 'reactjs-popup/dist/index.css';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

import "./fileUploadList.css";
import FileUploadListItems from "./FileUploadListItems";
import api from "../api/api"

const  FileUploadList = () => {
 const [uploadedFiles, setUploadedFiles] = useState([]);
 const [selectedFiles, setSelectedFiles] = useState([]);
 const fileInputRef = useRef();

 const handleFileChange = (event) => {
    setSelectedFiles([...event.target.files]);
 };

 const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const maxFileSize = 100*1024*1024;
    const allowedExtensions = [".csv",".txt",".pdf",".docx"];
    let filesappended = false;

    selectedFiles.forEach((file) => {
      if (file.size > maxFileSize){
        toast.error(`File ${file.name} is too large. Will not be uploaded.`);
        console.log(`File ${file.name} is too large. Will not be uploaded.`);
        return;
      }

      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(`.${fileExtension}`)){
        toast.error(`File ${file.name} has an invalid extension. Only .csv, .txt, .pdf, and .docx files are allowed.`);
        console.log(`File ${file.name} has an invalid extension. Only .csv, .txt, .pdf, and .docx files are allowed.`);
        return;
      }

      formData.append('files', file);
      filesappended = true;
    });


    if (filesappended){
      toast.success("Files Uploaded. Please Wait!")
      try {
        const response = await api.post('/upload_files/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast.success(response.data.message);
        setUploadedFiles(selectedFiles);
        console.log(response.data);
      } catch (error) {
        toast.error("Error! Failed to create conversational chain.", error.message);
        console.log("Error! Failed to create conversational chain.", error.message);
      }
    }else{
      toast.error("No files were uploaded!")
    }

    setSelectedFiles([]);
    fileInputRef.current.value = "";
 };

 return (
    <div className="main__fileuploadlist">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <input type="file" multiple onChange={handleFileChange} ref={fileInputRef}/>
          <button type="submit" className="custom-button">Upload</button>
        </form>
      </div>

      <ToastContainer autoClose={3000} hideProgressBar/>

      {selectedFiles.length > 0 &&
        <div className="fileuploadlist__items">
          <h2>Selected Files</h2>
          {selectedFiles.map((item, index) => (
            <FileUploadListItems
              key={item.id}
              name={item.name}
              animationDelay={index + 1}
            />
          ))}
        </div>
      }

      {uploadedFiles.length > 0 &&
        <div className="fileuploadlist__items">
          <h2>Uploaded Files</h2>
          {uploadedFiles.map((item, index) => (
            <FileUploadListItems
              key={item.id}
              name={item.name}
              animationDelay={index + 1}
            />
          ))}
        </div>
      }
    </div>
 );
};

export default FileUploadList;
