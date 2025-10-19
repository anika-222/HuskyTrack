import React, { useState, useRef, useEffect } from 'react';
import './DashboardCard.css';

export default function DashboardCard({ user }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [expandedPdf, setExpandedPdf] = useState(null);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderSavedSection = () => {
        return (<div className="saved-pdfs-section">
            <h2>Saved PDFs</h2>
            {user.savedPDFs && user.savedPDFs.length > 0 ? (
                <ul className="pdf-list">
                    {user.savedPDFs.map((pdf, idx) => (
                        <li key={idx} className="pdf-item">
                            <button
                                className="pdf-link"
                                onClick={() =>
                                    setExpandedPdf(expandedPdf === idx ? null : idx)
                                }
                            >
                                {pdf.name}
                            </button>

                            {expandedPdf === idx && (
                                <div className="pdf-preview">
                                    <iframe
                                        src={pdf.url}
                                        title={pdf.name}
                                        className="pdf-frame"
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No saved PDFs.</p>
            )}
        </div>)
    }

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

    const renderCurrentCourses = () => {
        return (
            <div className="current-courses-section">
                <div className="courses-header">
                    <h3>Current Courses</h3>
                </div>
                <div className="courses-list">
                    {user.currentCourses && user.currentCourses.length > 0 ? (
                        <ul>
                            {user.currentCourses.map((course, idx) => (
                                <li key={idx}>{course}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No current courses.</p>
                    )}
                </div>
            </div>
        )
    }

    const renderProgressBar = () => {
        return (
            <div className="progress-section">
                <h3>Degree Progress</h3>
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${user.progress}%` }}
                    />
                </div>
                <p>{user.progress}% complete</p>
            </div>
        )
    }

    const renderUploadTranscriptSection = () => {
        return (
            <div className="upload-section">
                <div className="button-section">
                    <h2>New Transcript</h2>
                    <button className="upload-button">Upload</button>
                </div>
                <p>Last Uploaded: transcript.pdf on 10/12/2025</p>
            </div>
        );
    }

    const renderUploadDarsSection = () => {
        return (
            <div className="upload-section">
                <div className="button-section">
                    <h2>New Degree Audit</h2>
                    <button className="upload-button">Upload</button>
                </div>
                <p>Last Uploaded: dars.pdf on 10/12/2025</p>
            </div>
        );
    }

    return (
        <>
            {renderHeader()}
            <div className="dashboard-content">
                <div className="dashboard-left">
                    <div className="dashboard-card">{renderCurrentCourses()}</div>
                    <div className="dashboard-card">{renderProgressBar()}</div>
                    <div className="dashboard-card">{renderUploadTranscriptSection()}</div>
                    <div className="dashboard-card">{renderUploadDarsSection()}</div>
                </div>

                <div className="dashboard-card-right">
                    {renderSavedSection()}
                </div>
            </div>
        </>
    )
}
