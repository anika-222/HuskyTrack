import React, { useState } from 'react';



export default function DashboardCard({user}) {
    const renderDashboard = () => {
        return (
            <div className="dashboard-content">
                <p>Email: {user.email}</p>
                <p>Degree: {user.degree}</p>
                <p>Expected Graduation: {user.expectedGraduation}</p>
                <p>Progress: {user.progress}%</p>
                <p>Saved PDFs: {user.savedPDFs}</p>
            </div>
        );
    }

    return (
        <div className="dashboard-card">
            <h3 id='main-header'>Welcome {user.name}</h3>
            {renderDashboard()}
        </div>
    );
}