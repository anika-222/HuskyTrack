import React, { useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx'
import Chat from './components/Chat.jsx';

export default function App() {
  const [pageType, setPageType] = useState('dashboard');

  const name = 'Jane Doe'

  const tempUser = {
    name: name,
    email: 'jane@example.com',
    degree: 'Computer Science',
    expectedGraduation: '2028',
    currentCourses: ['Foundations of Computing 1', 'Systems Programming', 'Software Design and Implementation'],
    progress: 53,
    savedPDFs: [
      { name: 'report1.pdf', url: 'reports/test.pdf' },
    ],
    chats: [
      { id: 0, title: '10/18/2025', artifacts: [{ sender: name, text: "Hello" }]},
    ]
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
      return (<Chat user={tempUser} id={undefined} />);
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
