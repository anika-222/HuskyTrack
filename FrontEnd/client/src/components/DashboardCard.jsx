import React, { useState, useRef, useEffect } from 'react';
import './DashboardCard.css';
import PDFUpload from './PDFUpload.jsx';
import PDFViewer from './PDFViewer.jsx';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';


export default function DashboardCard({ user, setUser }) {
    // State
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profile, setProfile] = useState(user);
    const [sub, setSub] = useState(null);
    const [viewingPdf, setViewingPdf] = useState(null);
    
    // Refs
    const dropdownRef = useRef(null);

    const handlePDFUpload = (pdfData) => {
        const newPDF = {
            name: pdfData.name,
            url: pdfData.url,
            type: pdfData.type,
            uploadDate: new Date().toLocaleDateString(),
            parsedData: pdfData.parsedData || null
        };
        
        // If it's a DARS file, update the progress bar and profile info
        if (pdfData.type === 'degree audit' && pdfData.parsedData && pdfData.parsedData.degreeProgress) {
            const progressData = pdfData.parsedData.degreeProgress;
            setUser(prevUser => ({
                ...prevUser,
                savedPDFs: [...prevUser.savedPDFs, newPDF],
                progress: progressData.progressPercentage,
                expectedGraduation: progressData.expectedGraduation,
                degreeProgress: progressData,
                // Update profile info from DARS data
                name: pdfData.parsedData.name || prevUser.name,
                major: pdfData.parsedData.major || prevUser.major
            }));
        } else {
            setUser(prevUser => ({
                ...prevUser,
                savedPDFs: [...prevUser.savedPDFs, newPDF]
            }));
        }
    };

  // local working copy of the user; start with props, then hydrate from Cognito/backend
    
 

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
    const renderSavedSection = () => {
        return (<div className="saved-pdfs-section">
            <h2>Saved PDFs</h2>
            {user.savedPDFs && user.savedPDFs.length > 0 ? (
                <ul className="pdf-list">
                    {user.savedPDFs.map((pdf, idx) => (
                        <li key={idx} className="pdf-item">
                            <button
                                className="pdf-link"
                                onClick={() => setViewingPdf(pdf)}
                            >
                                {pdf.name}
                            </button>
                            <div className="pdf-info">
                                <span className="pdf-type">{pdf.type}</span>
                                <span className="pdf-date">{pdf.uploadDate}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No saved PDFs.</p>
            )}
        </div>)
    }

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
                            <p><strong>Degree:</strong> {user.major}</p>
                            <p><strong>Expected Graduation:</strong> {user.expectedGraduation}</p>
                            {user.degreeProgress && (
                                <>
                                    <hr style={{ margin: '10px 0', border: '1px solid #eee' }} />
                                    <p><strong>Credits Completed:</strong> {user.degreeProgress.creditsCompleted}</p>
                                    <p><strong>Credits Required:</strong> {user.degreeProgress.totalCreditsRequired}</p>
                                    <p><strong>Credits Remaining:</strong> {user.degreeProgress.creditsRemaining}</p>
                                    <p><strong>Progress:</strong> {user.degreeProgress.progressPercentage}%</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>
        );

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
    const renderProgressBar = () => {
        const progressData = user.degreeProgress;
        
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
                {progressData && (
                    <div className="progress-details">
                        <div className="progress-item">
                            <span className="label">Credits Completed:</span>
                            <span className="value">{progressData.creditsCompleted}</span>
                        </div>
                        <div className="progress-item">
                            <span className="label">Credits Required:</span>
                            <span className="value">{progressData.totalCreditsRequired}</span>
                        </div>
                        <div className="progress-item">
                            <span className="label">Credits Remaining:</span>
                            <span className="value">{progressData.creditsRemaining}</span>
                        </div>
                        <div className="progress-item">
                            <span className="label">Expected Graduation:</span>
                            <span className="value">{progressData.expectedGraduation}</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderUploadTranscriptSection = () => {
        return (
            <div className="upload-section">
                <PDFUpload 
                    uploadType="Transcript" 
                    onUploadSuccess={handlePDFUpload}
                />
            </div>
        );
    }

    const renderUploadDarsSection = () => {
        return (
            <div className="upload-section">
                <PDFUpload 
                    uploadType="Degree Audit" 
                    onUploadSuccess={handlePDFUpload}
                />
            </div>
        );
    };

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
            {viewingPdf && (
                <PDFViewer 
                    pdf={viewingPdf} 
                    onClose={() => setViewingPdf(null)} 
                />
            )}
        </>
    )

}
}
