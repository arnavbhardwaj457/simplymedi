import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DoctorRegisterPage from './pages/Auth/DoctorRegisterPage';

// Protected pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import ReportsPage from './pages/Reports/ReportsPage';
import ReportDetailPage from './pages/Reports/ReportDetailPage';
import UploadReportPage from './pages/Reports/UploadReportPage';
import ChatPage from './pages/Chat/ChatPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import BookAppointmentPage from './pages/Appointments/BookAppointmentPage';
import AppointmentDetailPage from './pages/Appointments/AppointmentDetailPage';
import DoctorsPage from './pages/Doctors/DoctorsPage';
import DoctorProfilePage from './pages/Doctors/DoctorProfilePage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';

// Doctor pages
import DoctorDashboardPage from './pages/Doctor/DoctorDashboardPage';
import DoctorAppointmentsPage from './pages/Doctor/DoctorAppointmentsPage';
import DoctorProfileEditPage from './pages/Doctor/DoctorProfileEditPage';

// Error pages
import NotFoundPage from './pages/Error/NotFoundPage';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/register-doctor" element={<PublicRoute><DoctorRegisterPage /></PublicRoute>} />
        
        {/* Protected routes */}
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* User dashboard */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/upload" element={<UploadReportPage />} />
          <Route path="reports/:id" element={<ReportDetailPage />} />
          
          {/* Chat */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:sessionId" element={<ChatPage />} />
          
          {/* Appointments */}
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/book" element={<BookAppointmentPage />} />
          <Route path="appointments/book/:doctorId" element={<BookAppointmentPage />} />
          <Route path="appointments/:id" element={<AppointmentDetailPage />} />
          
          {/* Doctors */}
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:id" element={<DoctorProfilePage />} />
          
          {/* Profile & Settings */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Doctor routes */}
          <Route path="doctor" element={<ProtectedRoute requireDoctor={true}><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/doctor/dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboardPage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="profile" element={<DoctorProfileEditPage />} />
          </Route>
        </Route>
        
        {/* Error routes */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
