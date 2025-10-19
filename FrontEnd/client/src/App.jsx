// App.jsx
import React, { useEffect, useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx';
import Chat from './components/Chat.jsx';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export default function App() {
  const [pageType, setPageType] = useState('dashboard');
  const [activeChatId, setActiveChatId] = useState(null);

  // Start with an empty profile; we’ll hydrate from Cognito/backend.
  const [user, setUser] = useState({
    name: '',
    email: '',
    degree: '',
    expectedGraduation: '',
    currentCourses: [],
    progress: 0,
    savedPDFs: [],
    chats: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Ensure user is signed in; throws if not.
        const { userId } = await getCurrentUser(); // Cognito sub

        // Pull ID token claims for name/email.
        const { tokens } = await fetchAuthSession();
        const claims = tokens?.idToken?.payload ?? {};

        // Base profile from claims (empty if missing).
        const base = {
          name:
            claims.name ||
            claims.given_name ||
            (claims.email || '').split('@')[0] ||
            '',
          email: claims.email || '',
          degree: '',
          expectedGraduation: '',
          currentCourses: [],
          progress: 0,
          savedPDFs: [],
          chats: []
        };

        // Try to load an existing saved profile from your dev API.
        try {
          const res = await fetch(`http://localhost:4000/api/users/${userId}`);
          if (res.ok) {
            const saved = await res.json();
            // Make sure Cognito name/email win if present.
            setUser({
              ...saved,
              name: base.name || saved.name || '',
              email: base.email || saved.email || '',
              // Ensure arrays/fields exist even if backend omitted them.
              currentCourses: saved.currentCourses || [],
              savedPDFs: saved.savedPDFs || [],
              chats: saved.chats || []
            });
          } else {
            // No saved profile; just use the base (empty where unknown).
            setUser(base);
          }
        } catch {
          // Backend not running — fine for local dev; just use base.
          setUser(base);
        }
      } catch {
        // Not authenticated → go to login.
        window.location.replace('/signin');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startNewChat = () => {
    const chats = user.chats || [];
    const newId = chats.length;
    const now = new Date();
    const title = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`;
    const newChat = { id: newId, title, artifacts: [] };

    const updatedUser = {
      ...user,
      chats: [...chats, newChat]
    };

    setUser(updatedUser);
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
    if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

    if (pageType === 'dashboard') {
      // DashboardCard will happily accept an empty user and show blank fields.
      return <DashboardCard user={user} />;
    }

    if (pageType === 'chat' && activeChatId !== null) {
      return <Chat user={user} id={activeChatId} setUser={setUser} />;
    }

    return <div>Select a chat</div>;
  };

  return (
    <div className="app-container">
      {renderSidebar()}
      <div className="main-content-wrapper">{renderMainContent()}</div>
    </div>
  );
}
