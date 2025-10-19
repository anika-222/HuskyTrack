// App.jsx
import React, { useState } from 'react';
import './App.css';
import DashboardCard from './components/DashboardCard.jsx';

export default function App() {
  const [user, setUser] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    degree: 'Computer Science',
    expectedGraduation: '2028',
    currentCourses: ['Foundations of Computing 1', 'Systems Programming', 'Software Design and Implementation'],
    progress: 53,
    savedPDFs: [{ name: 'report1.pdf', url: 'reports/test.pdf' }]
  });

  return (
    <div className="App">
      <div className="header">
        <h1>HuskyTrack</h1>
      </div>
      <DashboardCard user={user} setUser={setUser} />
    </div>
  );
}
