import React from 'react';
import "./chatContent.css";

const Avatar = ({ image }) => {
 return (
    <div className="avatar">
      <div className="avatar-img">
        <img src={image} alt="#" />
      </div>
    </div>
 );
};

export default React.memo(Avatar);
