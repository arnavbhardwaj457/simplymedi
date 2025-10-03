import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const DoctorAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/doctors/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>

      {/* Filter */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Appointments
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            filter === 'confirmed'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            filter === 'pending'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            filter === 'completed'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'You have no appointments scheduled.'
              : `No ${filter} appointments found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{appointment.patient?.email}</p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span>{formatDate(appointment.appointmentDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <span>{formatTime(appointment.appointmentDate)}</span>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {appointment.notes}
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-3">
                {appointment.status === 'pending' && (
                  <button className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Confirm
                  </button>
                )}
                {appointment.status === 'confirmed' && (
                  <button className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Mark Complete
                  </button>
                )}
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentsPage;
