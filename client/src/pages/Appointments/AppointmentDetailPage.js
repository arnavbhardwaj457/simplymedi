import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AppointmentDetailPage = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointment = useCallback(async () => {
    try {
      const response = await api.get(`/appointments/${id}`);
      setAppointment(response.data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

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

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Appointment not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The appointment you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/app/appointments"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/app/appointments"
            className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Appointments
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Information</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Date</p>
                <p className="text-sm text-gray-600">{formatDate(appointment.appointmentDate)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Time</p>
                <p className="text-sm text-gray-600">{formatTime(appointment.appointmentDate)}</p>
              </div>
            </div>
            {appointment.notes && (
              <div>
                <p className="text-sm font-medium text-gray-900">Notes</p>
                <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Doctor Information</h2>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
              </h3>
              <p className="text-sm text-gray-500">{appointment.doctor?.specialization}</p>
              <p className="text-sm text-gray-500">
                {appointment.doctor?.experience} years of experience
              </p>
              {appointment.doctor?.phone && (
                <div className="mt-2 flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{appointment.doctor.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
        <div className="flex space-x-3">
          {appointment.status === 'pending' && (
            <button className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Cancel Appointment
            </button>
          )}
          {appointment.status === 'confirmed' && (
            <button className="inline-flex items-center px-4 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Reschedule
            </button>
          )}
          <Link
            to={`/app/doctors/${appointment.doctor?.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Doctor Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailPage;
