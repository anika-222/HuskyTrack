// Chat.jsx
import React, { useEffect, useState, useRef } from 'react';
import './Chat.css';

export default function Chat({ user, id, setUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatIdRef = useRef(id);

  useEffect(() => {
    const chat = user.chats.find(c => c.id === id);
    if (chat) {
      setMessages(chat.artifacts || []);
      chatIdRef.current = chat.id;
    }
  }, [id, user]);

  const handleSend = (sender) => {
    if (input.trim() === '') return;

    const newMessage = { sender, text: input };
    const updatedMessages = [...messages, newMessage].slice(-50);
    setMessages(updatedMessages);
    setInput('');

    const chatIndex = user.chats.findIndex(c => c.id === chatIdRef.current);
    if (chatIndex !== -1) {
      const updatedChats = [...user.chats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        artifacts: updatedMessages
      };
      setUser({ ...user, chats: updatedChats });
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="no-messages">Start chatting below!</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.sender === user.name ? 'user-message' : 'bot-message'}`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="send-button" onClick={() => handleSend(user.name)}>
          Send
        </button>
      </div>
    </div>
  );
}
