import React, { useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx'
import Chat from './components/Chat.jsx';

export default function App() {
  const [pageType, setPageType] = useState('dashboard');
  const [artifacts, setArtifacts] = useState(null);
  const [user, setUser] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    degree: 'Computer Science',
    expectedGraduation: '2028',
    currentCourses: ['Foundations of Computing 1', 'Systems Programming', 'Software Design and Implementation'],
    progress: 53,
    savedPDFs: [{ name: 'report1.pdf', url: 'reports/test.pdf' }],
    chats: []
  });


  console.log(user.chats);

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
            onClick={() => { setPageType('chat'); setArtifacts(null); }}
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
    if (!user.chats || user.chats.length === 0) {
      return <div>No chats yet</div>;
    }

    return (
      <div className="past-chats-list">
        {user.chats.map((chat) => (
          <div
            key={chat.id}
            data-id={chat.id}
            className="past-chat-item"
            onClick={() => { setArtifacts(chat.id); setPageType('chat');  }} 
          >
            {chat.title}
          </div>
        ))}
      </div>
    );
  };

  // Render Main Content
  const renderMainContent = () => {
    if (pageType === 'dashboard') {
      return (<DashboardCard user={user} />);
    }

    if (pageType === 'chat' && !artifacts) {
      return (<Chat user={user} id={-1} setUser={setUser} />);
    }

    if (pageType === 'chat' && artifacts) {
      return (<Chat user={user} id={artifacts} setUser={setUser} />);
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
