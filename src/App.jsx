import React, { useState } from 'react';
import Header from './components/Header';
import Courses from './components/Courses';
import EncouragementModal from './components/EncouragementModal';
import './styles/EncouragementModal.css'; // <-- RE-ADDED THIS IMPORT

function App() {
  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses'); // Manage current page state

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App min-h-screen flex flex-col bg-gray-100">
      <Header onNavigate={handleNavigate} onOpenEncouragement={() => setIsEncouragementModalOpen(true)} />

      <main className="flex-grow">
        {currentPage === 'courses' && <Courses />}
        {currentPage === 'settings' && <div>Settings Page Content (Coming Soon!)</div>}
      </main>

      <EncouragementModal
        isOpen={isEncouragementModalOpen}
        onClose={() => setIsEncouragementModalOpen(false)}
      />
    </div>
  );
}

export default App;