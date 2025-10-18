import React, { useState } from 'react';
import './App.css'; 

export default function App() {
  const [pageType, setPageType] = useState('dashboard');

  // Render Sidebar
  const renderSidebar = () => {
    return (
      <div className='sidebar'>
        <h2 className='app-title'>HuskyTrack</h2>
        <ul className='sidebar-list'>
          <li
            className={`sidebar-item ${pageType === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPageType('dashboard')}
          >
            Dashboard
          </li>
          <li
            className={`sidebar-item ${pageType === 'chat' ? 'active' : ''}`}
            onClick={() => setPageType('chat')}
          >
            Chat
          </li>
        </ul>

        <div className='past-chats'>
          <h3>Past Chats</h3>
          {renderPastChats()}
        </div>
      </div>
    );
  };

  // Render Past Chats
  const renderPastChats = () => {
    return <div>No chats yet</div>;
  };

  // Render Main Content
  const renderMainContent = () => {
    if (pageType === 'dashboard') {
      return (
        <div className='main-content'>
          <h2>Dashboard</h2>
          <p>Welcome to your HuskyTrack dashboard!</p>
        </div>
      );
    }

    if (pageType === 'chat') {
      return (
        <div className='main-content'>
          <h2>Chat</h2>
          <p>This is where your chat messages will appear.</p>
        </div>
      );
    }
  };

  // Render all Content
  return (
    <div className='app-container'>
      {renderSidebar()}
      {renderMainContent()}
    </div>
  );
}
