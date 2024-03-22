import React from "react";

const FileUploadListItems = ({ name }) => {
 return (
    <div>
      <p>{name}</p>
    </div>
 );
};

export default React.memo(FileUploadListItems);
