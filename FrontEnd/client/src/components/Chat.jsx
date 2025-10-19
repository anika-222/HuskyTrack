import React, { useState } from 'react';
import './Chat.css';

export default function Chat({ user, id, setUser }) {
    const [message, setMessage] = useState('');
    const chat = user.chats?.find(c => c.id === id);

    if (!chat) {
        return <div>Chat not found</div>;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage = {
            id: Date.now(),
            text: message,
            sender: user.name || 'User',
            timestamp: new Date().toISOString()
        };

        setUser(prev => {
            const updatedChats = prev.chats.map(c => {
                if (c.id === id) {
                    return {
                        ...c,
                        messages: [...(c.messages || []), newMessage]
                    };
                }
                return c;
            });
            return { ...prev, chats: updatedChats };
        });

        setMessage('');
    };

    return (
        <div className="chat-container">
            <h2>{chat.title}</h2>
            <div className="chat-messages">
                {chat.messages?.map(msg => (
                    <div key={msg.id} className={`message ${msg.sender === user.name ? 'user-message' : 'other-message'}`}>
                        <div className="message-content">
                            <p>{msg.text}</p>
                            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                />
                <button type="submit" className="send-button">Send</button>
            </form>
        </div>
    );
}