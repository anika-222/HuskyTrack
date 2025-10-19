import React, { useEffect, useState } from 'react';
import './Chat.css';

export default function Chat({ user, id }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!user || !id) return;

        if (id == undefined) {
            id = user.chats.length;
            const today = new Date();
            const dateString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
            user.chats.push({ id: id, title: 'dateString', artifacts: [] });
        }
        const chat = user.chats.find(c => c.id === id);
        if (chat && chat.artifacts?.length > 0) {
            setMessages(chat.artifacts);
        }

        return () => {
            const chatIndex = user.chats.findIndex((c) => c.id === id);
            if (chatIndex !== -1) {
                user.chats[chatIndex].artifacts = messages;
            }
        };
    }, [user, id, messages]);

    const handleSend = (sender) => {
        if (input.trim() === '') return;

        const newMessage = { sender, text: input };
        const updatedMessages = [...messages, newMessage].slice(-50);

        setMessages(updatedMessages);
        setInput('');
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
                            className={`chat-message ${msg.sender === user.name ? 'user-message' : 'bot-message'
                                }`}
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
