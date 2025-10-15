//material.tsx
'use client';

import { useState } from 'react';
import MaterialsPage from './MaterialsPage';
import UnitsPage from './UnitsPage';
import QuizzesPage from './QuizzesPage';

type Page = 'materials' | 'units' | 'quizzes';

export default function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>('materials');

  const renderPage = () => {
    switch (currentPage) {
      case 'materials':
        return <MaterialsPage onNavigate={setCurrentPage} />;
      case 'units':
        return <UnitsPage onNavigate={setCurrentPage} />;
      case 'quizzes':
        return <QuizzesPage onNavigate={setCurrentPage} />;
      default:
        return <MaterialsPage onNavigate={setCurrentPage} />;
    }
  };

 return (
  <div className="min-h-screen bg-gray-800">
    <nav className="bg-gray-700 text-white p-4">
      <div className="container mx-auto flex justify-center gap-4">
        <button 
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            currentPage === 'materials' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-600 hover:bg-blue-500 hover:text-white'
          }`}
          onClick={() => setCurrentPage('materials')}
        >
          المواد
        </button>
        <button 
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            currentPage === 'units' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-600 hover:bg-blue-500 hover:text-white'
          }`}
          onClick={() => setCurrentPage('units')}
        >
          الوحدات
        </button>
        <button 
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            currentPage === 'quizzes' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-600 hover:bg-blue-500 hover:text-white'
          }`}
          onClick={() => setCurrentPage('quizzes')}
        >
          الأسئلة
        </button>
      </div>
    </nav>
    {renderPage()}
  </div>
);

}