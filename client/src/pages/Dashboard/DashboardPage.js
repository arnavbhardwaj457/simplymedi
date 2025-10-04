import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  DocumentTextIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ArrowRightIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslatedTexts } from '../../hooks/useTranslation';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Card from '../../components/UI/Card';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t, formatDate, currentLanguage } = useLanguage();

  // Dynamic translation for UI elements
  const uiTexts = [
    'Chat with AI',
    'Get instant answers to health questions',
    'Telegram Bot',
    'Chat with SimplyMedi on Telegram for instant updates',
    'Welcome back',
    'Quick Actions',
    'Get started',
    'Loading dashboard...',
    'Total Reports',
    'Appointments',
    'Chat Sessions',
    'Processed',
    'Here\'s an overview of your health journey with SimplyMedi',
    'Upload Report',
    'Upload a new medical report for AI analysis',
    'Book Appointment',
    'Schedule an appointment with a doctor',
    'Recent Reports',
    'View all',
    'Upcoming Appointments',
    'No reports yet',
    'Upload your first medical report to get started',
    'No upcoming appointments',
    'Book your first appointment'
  ];

  const { translations, isTranslating } = useTranslatedTexts(uiTexts, 'general');

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => usersAPI.getDashboard(),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text={translations['Loading dashboard...'] || 'Loading dashboard...'} />
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    // Show dashboard with default values on error
  }

  const { recentReports, upcomingAppointments, statistics } = dashboardData || { 
    recentReports: [], 
    upcomingAppointments: [], 
    statistics: { 
      totalReports: 0, 
      totalAppointments: 0, 
      completedAppointments: 0, 
      processedReports: 0 
    } 
  };

  const quickActions = [
    {
      name: t('uploadReport'),
      description: t('uploadReportDescription'),
      href: '/app/reports/upload',
      icon: DocumentTextIcon,
      color: 'primary',
    },
    {
      name: t('bookAppointment'),
      description: t('bookAppointmentDescription'),
      href: '/app/appointments/book',
      icon: CalendarDaysIcon,
      color: 'secondary',
    },
    {
      name: translations['Chat with AI'] || 'Chat with AI',
      description: translations['Get instant answers to health questions'] || 'Get instant answers to health questions',
      href: '/app/chat',
      icon: ChatBubbleLeftRightIcon,
      color: 'success',
    },
    {
      name: translations['Telegram Bot'] || 'Telegram Bot',
      description: translations['Chat with SimplyMedi on Telegram for instant updates'] || 'Chat with SimplyMedi on Telegram for instant updates',
      href: 'https://t.me/SimplyMediBot',
      icon: DevicePhoneMobileIcon,
      color: 'info',
      external: true,
    },
  ];

  const getRiskColor = (riskLevel) => {
    const colors = {
      low: 'text-success-600 bg-success-100',
      medium: 'text-warning-600 bg-warning-100',
      high: 'text-danger-600 bg-danger-100',
      critical: 'text-danger-800 bg-danger-200',
    };
    return colors[riskLevel] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {translations['Welcome back'] || t('welcomeBack')}, {user?.firstName}!
        </h1>
        <p className="text-primary-100">
          {translations['Here\'s an overview of your health journey with SimplyMedi'] || t('healthJourneyOverview')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{translations['Total Reports'] || 'Total Reports'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics?.totalReports || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDaysIcon className="h-8 w-8 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{translations['Appointments'] || 'Appointments'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics?.totalAppointments || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{translations['Chat Sessions'] || 'Chat Sessions'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics?.completedAppointments || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{translations['Processed'] || 'Processed'}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics?.processedReports || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{translations['Quick Actions'] || 'Quick Actions'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const content = (
              <>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                    <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {action.name}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{action.description}</p>
                <div className="flex items-center text-primary-600 font-medium">
                  <span>{translations['Get started'] || 'Get started'}</span>
                  <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </>
            );

            if (action.external) {
              return (
                <a
                  key={action.name}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card p-6 hover:shadow-medium transition-shadow group"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={action.name}
                to={action.href}
                className="card p-6 hover:shadow-medium transition-shadow group"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              <Link
                to="/app/reports"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentReports?.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {report.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.reportType} • {formatDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {report.simplifiedReport && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(report.simplifiedReport.riskLevel)}`}>
                          {report.simplifiedReport.riskLevel}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.processingStatus === 'completed' 
                          ? 'text-success-600 bg-success-100'
                          : report.processingStatus === 'processing'
                          ? 'text-warning-600 bg-warning-100'
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        {report.processingStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No reports uploaded yet</p>
                <Link
                  to="/app/reports/upload"
                  className="btn-primary btn-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload Report
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
              <Link
                to="/app/appointments"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {upcomingAppointments?.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          Dr. {appointment.doctor.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.doctor.specialization} • {formatDate(appointment.appointmentDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'confirmed' 
                          ? 'text-success-600 bg-success-100'
                          : 'text-warning-600 bg-warning-100'
                      }`}>
                        {appointment.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {appointment.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                <Link
                  to="/app/appointments/book"
                  className="btn-primary btn-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Book Appointment
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
