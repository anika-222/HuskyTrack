import React, { useEffect, useState, useRef } from 'react';
import './Chat.css';

export default function Chat({ user, id, setUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatIdRef = useRef(null);

  useEffect(() => {
    if (!user || id == null) return;

    let chatId = id;
    let updatedUser = { ...user };

    // Create new chat if id === -1
    if (chatId === -1) {
      chatId = updatedUser.chats.length;
      const today = new Date();
      const dateString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
      const newChat = { id: chatId, title: dateString, artifacts: [] };
      updatedUser = {
        ...updatedUser,
        chats: [...updatedUser.chats, newChat]
      };
      setUser(updatedUser);
    }

    const chat = updatedUser.chats.find(c => c.id === chatId);
    setMessages(chat?.artifacts || []);
    chatIdRef.current = chatId;
  }, [id, user, setUser]);

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