// FrontEnd/client/src/components/DashboardCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import './DashboardCard.css';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';

export default function DashboardCard({ user }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [expandedPdf, setExpandedPdf] = useState(null);

  // local working copy of the user; start with props, then hydrate from Cognito/backend
    const [profile, setProfile] = useState(user);
    const [sub, setSub] = useState(null);

  // ---- load Cognito identity (name/email) and persist profile once on mount
    useEffect(() => {
        (async () => {
            try {
        // throws if not signed in
        const { userId } = await getCurrentUser(); // Cognito sub
        setSub(userId);

        // get ID token claims (email, name, etc.)
        const { tokens } = await fetchAuthSession();
        const claims = tokens?.idToken?.payload ?? {};

        const merged = {
            ...profile,
            name:
            claims.name ||
            claims.given_name ||
            (claims.email || '').split('@')[0] ||
            profile.name ||
            'User',
            email: claims.email || profile.email || '',
        };

        setProfile(merged);

        // try to load an existing saved profile from your dev API
        try {
            const res = await fetch(`http://localhost:4000/api/users/${userId}`);
            if (res.ok) {
            const saved = await res.json();
            // make sure name/email from Cognito win
            setProfile({ ...saved, name: merged.name, email: merged.email });
            } else if (res.status === 404) {
            // first visit -> save defaults immediately
            await fetch(`http://localhost:4000/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: merged }),
            });
            }
        } catch {
          // no backend running? that's fine for the demo; just use merged
        }
        } catch (e) {
        // not authenticated -> go to login
        window.location.replace('/signin');
        }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  // close dropdown on outside click
    useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  // ---- helpers to persist any profile change (e.g., when you wire Upload/Chat later)
    async function saveProfile(next) {
    setProfile(next);
    if (!sub) return;
    try {
        await fetch(`http://localhost:4000/api/users/${sub}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: next }),
        });
    } catch {
      // ignore if API not running
    }
    }

    const renderSavedSection = () => (
    <div className="saved-pdfs-section">
        <h2>Saved PDFs</h2>
        {profile.savedPDFs && profile.savedPDFs.length > 0 ? (
        <ul className="pdf-list">
            {profile.savedPDFs.map((pdf, idx) => (
            <li key={idx} className="pdf-item">
                <button
                className="pdf-link"
                onClick={() => setExpandedPdf(expandedPdf === idx ? null : idx)}
                >
                {pdf.name}
                </button>

                {expandedPdf === idx && (
                <div className="pdf-preview">
                    <iframe src={pdf.url} title={pdf.name} className="pdf-frame" />
                </div>
                )}
            </li>
            ))}
        </ul>
        ) : (
        <p>No saved PDFs.</p>
        )}
    </div>
    );

    const renderHeader = () => (
    <header className="app-header">
        <h1 className="header-title">Hello {profile.name}!</h1>

        <div className="profile-dropdown" ref={dropdownRef}>
        <button
            className="dropdown-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
        >
            Profile ▼
        </button>

        {dropdownOpen && (
            <div className="dropdown-content">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Degree:</strong> {profile.degree}</p>
            <p><strong>Expected Graduation:</strong> {profile.expectedGraduation}</p>

            <hr style={{ margin: '8px 0', opacity: 0.3 }} />

            {/* Logout button */}
            <button
                onClick={async () => {
                try {
                  await signOut();     // end Cognito session
                } finally {
                        window.location.replace('/signin');
                }
                }}
                style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                padding: '6px 0',
                cursor: 'pointer',
                color: '#6a1b9a',
                fontWeight: 700,
                }}
            >
                    Sign out
            </button>
            </div>
        )}
        </div>
    </header>
    );

    const renderCurrentCourses = () => (
    <div className="current-courses-section">
        <div className="courses-header">
        <h3>Current Courses</h3>
        </div>
        <div className="courses-list">
        {profile.currentCourses && profile.currentCourses.length > 0 ? (
            <ul>
            {profile.currentCourses.map((course, idx) => (
                <li key={idx}>{course}</li>
            ))}
            </ul>
        ) : (
            <p>No current courses.</p>
        )}
        </div>
    </div>
    );

    const renderProgressBar = () => (
    <div className="progress-section">
        <h3>Degree Progress</h3>
        <div className="progress-bar-container">
        <div
            className="progress-bar-fill"
            style={{ width: `${profile.progress}%` }}
        />
        </div>
        <p>{profile.progress}% complete</p>
    </div>
    );

    const renderUploadTranscriptSection = () => (
    <div className="upload-section">
        <div className="button-section">
        <h2>New Transcript</h2>
        <button
            className="upload-button"
            onClick={() => {
            // example of persisting a change (stub)
            const next = {
                ...profile,
                savedPDFs: [
                ...(profile.savedPDFs || []),
                { name: 'transcript.pdf', url: '/reports/report1.pdf' },
                ],
            };
            saveProfile(next);
            }}
        >
            Upload
        </button>
        </div>
        <p>Last Uploaded: transcript.pdf on 10/12/2025</p>
    </div>
    );

    const renderUploadDarsSection = () => (
    <div className="upload-section">
        <div className="button-section">
        <h2>New Degree Audit</h2>
        <button className="upload-button">Upload</button>
        </div>
        <p>Last Uploaded: dars.pdf on 10/12/2025</p>
    </div>
    );

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

        <div className="dashboard-card-right">{renderSavedSection()}</div>
        </div>
    </>
    );
}
