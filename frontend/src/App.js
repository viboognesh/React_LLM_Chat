import React from "react";
import "./App.css";
import ChatContent from "./components/chatContent/ChatContent";
import FileUploadList from "./components/fileUploadList/FileUploadList";

function App() {
  return (
    <div className="main__body">
      <div className="main__chatbody">
        <FileUploadList />
        <ChatContent />
      </div>
    </div>
  );
}

export default App;
