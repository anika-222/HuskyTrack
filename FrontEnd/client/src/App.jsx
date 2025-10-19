// src/App.jsx
import React, { useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx';
import Chat from './components/Chat.jsx';
import SignIn from './SignIn.jsx';

export default function App() {
  // Start app showing sign-in page. After sign-in, show dashboard/chat UI.
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [pageType, setPageType] = useState('dashboard');
  const [activeChatId, setActiveChatId] = useState(null);

  const [user, setUser] = useState({
    name: '',
    email: '',
    degree: '',
    expectedGraduation: '',
    currentCourses: [],
    progress: 0,
    savedPDFs: [],
    chats: [],
  });

  const onSignIn = (signedInUser) => {
    // If SignIn passes a user object, use it; otherwise keep existing.
    setUser(signedInUser ? { ...user, ...signedInUser } : user);
    setIsSignedIn(true);
  };

  const startNewChat = () => {
    const chats = user.chats || [];
    const newId = chats.length > 0 ? Math.max(...chats.map(c => c.id ?? 0)) + 1 : 0;
    const title = new Date().toLocaleString();
    const newChat = { id: newId, title, artifacts: [] };

    setUser(prev => ({ ...prev, chats: [...(prev.chats || []), newChat] }));
    setActiveChatId(newId);
    setPageType('chat');
  };

  const renderPastChats = () => {
    const chats = user.chats || [];
    if (chats.length === 0) return <div>No chats yet</div>;
    return (
      <div className="past-chats-list">
        {[...chats].reverse().map((chat) => (
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

  const renderSidebar = () => (
    <div className="sidebar">
      <h2 className="app-title">HuskyTrack</h2>
      <ul className="sidebar-list">
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
      <div className="past-chats">
        <h3>Past Chats</h3>
        {renderPastChats()}
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (pageType === 'dashboard') return <DashboardCard user={user} />;
    if (pageType === 'chat' && activeChatId != null)
      return <Chat user={user} id={activeChatId} setUser={setUser} />;
    return <div>Select a chat</div>;
  };

  if (!isSignedIn) {
    return <SignIn onSignIn={onSignIn} />;
  }

  return (
    <div className="app-container">
      {renderSidebar()}
      <div className="main-content-wrapper">{renderMainContent()}</div>
    </div>
  );
}
