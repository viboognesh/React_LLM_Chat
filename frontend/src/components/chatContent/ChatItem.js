import React from 'react';

const ChatItem = React.memo(({ user = "human", msg, animationDelay }) => {
 const isHuman = user === "human";
 const alignmentStyle = isHuman ? { textAlign: "right" } : { textAlign: "left" };

 return (
    <div
      style={{ animationDelay: `${animationDelay}s`, ...alignmentStyle }}
      className={`chat__item ${isHuman ? "human" : "ai"}`}
    >
      <div className="chat__item__content">
        <div className="chat__msg">{msg}</div>
      </div>
    </div>
 );
});

export default ChatItem;
