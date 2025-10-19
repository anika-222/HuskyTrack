// Chat.jsx
import React, { useEffect, useState, useRef } from 'react';
import './Chat.css';

export default function Chat({ user, id, setUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatIdRef = useRef(id);

  useEffect(() => {
    const chat = user.chats.find(c => c.id === id);
    if (chat) {
      setMessages(chat.artifacts || []);
      chatIdRef.current = chat.id;
    }
  }, [id, user]);

  const sendToServer = async (payload) => {
    try {
      setLoading(true);
      // Get the latest user message
      const latestMessage = payload.messages[payload.messages.length - 1];
      
      // Format the payload to match Lambda's expected structure
      const promptPayload = {
        prompt: latestMessage.text,
        messages: payload.messages,  // Include full message history
        user: {
          name: payload.user.name,
          degree: payload.user.degree || 'Computer Science',
          expectedGraduation: payload.user.expectedGraduation || '2026',
          currentCourses: payload.user.currentCourses || [],
          completedCourses: payload.user.completedCourses || []
        }
      };

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload),
        timeout: 30000 // 30 second timeout
      });

      if (!resp.ok) {
        let errorMessage = 'Server error';
        try {
          const errorJson = await resp.json();
          errorMessage = errorJson.message || errorJson.error || 'Unknown error';
        } catch (e) {
          errorMessage = await resp.text() || resp.statusText || 'Server error';
        }
        throw new Error(errorMessage);
      }

      const json = await resp.json();

      let botText = 'No response';
      if (json && json.lambda) {
        try {
          let response;
          
          // Parse the lambda response
          if (typeof json.lambda === 'string') {
            response = JSON.parse(json.lambda);
          } else if (typeof json.lambda.body === 'string') {
            response = JSON.parse(json.lambda.body);
          } else {
            response = json.lambda;
          }

          // Extract the generated text
          if (response.generated_text) {
            botText = response.generated_text;
          } else if (typeof response === 'string') {
            botText = response;
          } else {
            botText = JSON.stringify(response, null, 2);
          }

        } catch (e) {
          console.error('Error parsing response:', e);
          // If parsing fails, try to use the raw response
          botText = typeof json.lambda === 'string' ? 
            json.lambda : 
            JSON.stringify(json.lambda, null, 2);
        }
      } else if (json && json.error) {
        botText = `Error: ${json.error}`;
      }

      // Add the AI response as a new message while preserving existing messages
      const botMessage = { sender: 'Advisor', text: botText };
      
      // Update both messages state and user.chats atomically
      setMessages(currentMessages => {
        const updatedMessages = [...currentMessages, botMessage].slice(-50);
        
        // Also persist to user.chats
        const chatIndex = user.chats.findIndex(c => c.id === chatIdRef.current);
        if (chatIndex !== -1) {
          const updatedChats = [...user.chats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            artifacts: updatedMessages  // Use the new messages array instead of stale messages
          };
          setUser({ ...user, chats: updatedChats });
        }
        
        return updatedMessages;
      });
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = { 
        sender: 'System', 
        text: `Error: ${err.message}. Please try again or contact support if the problem persists.` 
      };
      
      // Update both messages state and user.chats atomically
      setMessages(currentMessages => {
        const updatedMessages = [...currentMessages, errorMessage];
        
        // Also persist to chat history
        const chatIndex = user.chats.findIndex(c => c.id === chatIdRef.current);
        if (chatIndex !== -1) {
          const updatedChats = [...user.chats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            artifacts: updatedMessages
          };
          setUser({ ...user, chats: updatedChats });
        }
        
        return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (sender) => {
    if (input.trim() === '') return;

    // Create the new user message
    const newMessage = { sender, text: input };
    
    // Update messages state with the new user message
    setMessages(currentMessages => {
      const updatedMessages = [...currentMessages, newMessage].slice(-50);
      
      // Update chat history immediately with just the user's message
      const chatIndex = user.chats.findIndex(c => c.id === chatIdRef.current);
      if (chatIndex !== -1) {
        const updatedChats = [...user.chats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          artifacts: updatedMessages
        };
        setUser({ ...user, chats: updatedChats });
      }

      // Send to backend to get recommendation from Lambda
      // Pass the updated messages to ensure the AI has the complete context
      sendToServer({ user, messages: updatedMessages });

      return updatedMessages;
    });

    // Clear input field
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
        <button className="send-button" onClick={() => handleSend(user.name)} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
