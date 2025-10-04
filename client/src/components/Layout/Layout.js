import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, doctor } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-50 to-coffee-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-secondary-900/75 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userType={doctor ? 'doctor' : 'user'}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          doctor={doctor}
        />

        {/* Page content */}
        <main className="py-6 animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
