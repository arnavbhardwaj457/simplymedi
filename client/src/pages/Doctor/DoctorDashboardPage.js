import React, { useState, useEffect } from 'react';
import { CalendarIcon, UserIcon, DocumentTextIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const DoctorDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, appointmentsResponse] = await Promise.all([
        api.get('/doctors/dashboard/stats'),
        api.get('/doctors/appointments?limit=5')
      ]);
      setStats(statsResponse.data);
      setRecentAppointments(appointmentsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.todayAppointments || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.totalPatients || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Reports Reviewed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.reportsReviewed || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chat Sessions</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.chatSessions || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Appointments</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentAppointments.length === 0 ? (
            <div className="p-6 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your recent appointments will appear here.
              </p>
            </div>
          ) : (
            recentAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                        {new Date(appointment.appointmentDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
