import React from 'react';
import { useLocation } from 'react-router-dom';
import './FloatingChatbotIcon.css';

const FloatingChatbotIcon = () => {
    const location = useLocation();
    
    // Hide the floating icon if user is already on the chatbot page
    if (location.pathname === '/chatbot') {
        return null;
    }

    const handleClick = () => {
        window.location.href = '/chatbot';
    };

    return (
        <div className="floating-chatbot-icon" onClick={handleClick}>
            <div className="icon">💬</div>
        </div>
    );
};

export default FloatingChatbotIcon; 