import React, { useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx'

export default function App() {
  const [pageType, setPageType] = useState('dashboard');

  const tempUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    degree: 'Computer Science',
    expectedGraduation: '2028',
    currentCourses: ['Foundations of Computing 1', 'Systems Programming', 'Software Design and Implementation'],
    progress: 53,
    savedPDFs: [
      { name: 'report1.pdf', url: 'reports/test.pdf' },
    ],
  }

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
      return (<DashboardCard user={tempUser} />);
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
      <div className="main-content-wrapper">
        {renderMainContent()}
      </div>
    </div>
  );
}
