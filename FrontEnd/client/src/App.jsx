import React, { useState } from 'react';

export default function App() {

  //Render Sidebar
  const renderSidebar = () => {
    return (
      <></>
    );
  }

  //Render Main Content
  const renderMainContent = () => {
    return (
      <></>
    );
  }


  //Return the Content
  return (
    <div className='all-content'>
      <div className='sidebar'>{renderSidebar}</div>
      <div className='main-content'>{renderMainContent}</div>
    </div>
  );
}
