// App.jsx
import React, { useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  const [pageType, setPageType] = useState('dashboard');
  const [activeChatId, setActiveChatId] = useState(null);
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

  // ✅ Create a new chat explicitly
  const startNewChat = () => {
    const newId = user.chats.length;
    const today = new Date();
    const title = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const newChat = { id: newId, title, artifacts: [] };

    const updatedUser = {
      ...user,
      chats: [...user.chats, newChat]
    };

    setUser(updatedUser);
    setActiveChatId(newId);
    setPageType('chat');
  };

  // Sidebar
  const renderSidebar = () => (
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
          onClick={startNewChat}
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

  const renderPastChats = () => {
    if (!user.chats || user.chats.length === 0) {
      return <div>No chats yet</div>;
    }

    return (
      <div className="past-chats-list">
        {user.chats.map((chat) => (
          <div
            key={chat.id}
            className="past-chat-item"
            onClick={() => {
              setActiveChatId(chat.id);
              setPageType('chat');
            }}
          >
            {chat.title}
          </div>
        ))}
      </div>
    );
  };

  const renderMainContent = () => {
    if (pageType === 'dashboard') {
      return <DashboardCard user={user} />;
    }

    if (pageType === 'chat' && activeChatId !== null) {
      return <Chat user={user} id={activeChatId} setUser={setUser} />;
    }

    return <div>Select a chat</div>;
  };

  return (
    <div className='app-container'>
      {renderSidebar()}
      <div className="main-content-wrapper">
        {renderMainContent()}
      </div>
    </div>
  );
}
