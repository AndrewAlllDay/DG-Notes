// src/App.jsx (assuming this is your main app component)
import React, { useState } from 'react';
import Header from './components/Header'; // Assuming Header is here
import Courses from './components/Courses';
import SettingsPage from './components/SettingsPage'; // Import the new SettingsPage

function App() {
  // State to manage which page is currently active
  const [currentPage, setCurrentPage] = useState('courses'); // 'courses' or 'settings'

  // Function to render the correct component based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'courses':
        return <Courses />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Courses />; // Fallback
    }
  };

  return (
    // Make the App container a flex column that takes full screen height
    <div className="flex flex-col h-screen">
      <Header onNavigate={setCurrentPage} />
      {/* The main content area should grow to fill remaining space and manage its overflow */}
      <main className="flex-grow overflow-hidden">
        {currentPage === 'courses' && <Courses />}
        {currentPage === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;