import React, { useState, useRef, useEffect } from 'react';
import './DashboardCard.css';

export default function DashboardCard({ user }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderHeader = () => {
        return (
            <header className="app-header">
                <h1 className="header-title">Hello {user.name}!</h1>

                <div className="profile-dropdown" ref={dropdownRef}>
                    <button
                        className="dropdown-button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        Profile ▼
                    </button>

                    {dropdownOpen && (
                        <div className="dropdown-content">
                            <p><strong>Name:</strong> {user.name}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Degree:</strong> {user.degree}</p>
                            <p><strong>Expected Graduation:</strong> {user.expectedGraduation}</p>
                        </div>
                    )}
                </div>
            </header>
        );
    }

    return (renderHeader())
}
