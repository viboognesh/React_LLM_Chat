import React, { useState, useEffect, useRef, useCallback } from "react";
import "./chatContent.css";
import Avatar from "./Avatar";
import ChatItem from "./ChatItem";
import api from "../api/api";

const ChatContent = () => {
 const messagesEndRef = useRef(null);
 const [chat, setChat] = useState([]);
 const [msg, setMsg] = useState("");


 // Function to handle adding a human message
 const addHumanMessage = useCallback((message) => {
    const updatedChatItems = [...chat, { key: chat.length + 1, type: 'human', msg: message }];
    setChat(updatedChatItems);
    setMsg(''); // Clear the input field
 }, [chat]);

// Keydown listener to add human messages
 useEffect(() => {
    const keydownListener = (e) => {
      if (e.key === "Enter" && msg !== "") {
        addHumanMessage(msg);
        scrollToBottom();
      }
    };

    window.addEventListener("keydown", keydownListener);
    return () => window.removeEventListener("keydown", keydownListener);
 }, [msg, addHumanMessage]); // Depend on msg and addHumanMessage to re-run the effect

 // Effect to fetch the AI response whenever a new human message is added
 useEffect(() => {
    const lastMessage = chat[chat.length - 1];
    if (lastMessage && lastMessage.type === 'human') {
      const fetchAiResponse = async () => {
        try {
          const response = await api.get('/predict/', { params: { query: lastMessage.msg } });
          const updatedChatItems = [...chat, { key: chat.length + 1, type: 'ai', msg: response.data.answer }];
          setChat(updatedChatItems);
        } catch (error) {
          console.error('Error fetching AI response:', error);
        }
      };

      fetchAiResponse();
    }
 }, [chat]); // Depend on chat to re-run the effect


 const scrollToBottom = () => {
  setTimeout(()=>{
    if(messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  },0);
 };

 const onStateChange = (e) => {
    setMsg(e.target.value);
 };

 return (
    <div className="main__chatcontent">
      <div className="content__header">
        <div className="blocks">
          <div className="current-chatting-user">
            <Avatar
              image="https://static.vecteezy.com/system/resources/previews/022/227/370/original/openai-chatgpt-logo-icon-free-png.png"
            />
            <p>OpenAI</p>
          </div>
        </div>

      </div>
      <div className="content__body">
        <div className="chat__items">
          {chat.map((itm, index) => (
              <ChatItem
                key={itm.key}
                user={itm.type}
                msg={itm.msg}
                animationDelay={index}
              />
            ))}
          <div ref={messagesEndRef} /> 
        </div>

      </div>
      <div className="content__footer">
        <div className="sendNewMessage">
          <input
            type="text"
            placeholder="Type a message here"
            onChange={onStateChange}
            value={msg}
          />
        </div>
      </div>
    </div>
 );
};

export default ChatContent;
