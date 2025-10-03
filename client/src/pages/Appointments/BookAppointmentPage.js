import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const BookAppointmentPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const selectedDate = watch('appointmentDate');

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
      
      if (doctorId) {
        const doctor = response.data.find(d => d.id === doctorId);
        if (doctor) {
          setSelectedDoctor(doctor);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailableSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDate, selectedDoctor]);

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      const response = await api.get(`/appointments/availability/${doctorId}`, {
        params: { date }
      });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/appointments', {
        ...data,
        doctorId: selectedDoctor.id,
      });
      toast.success('Appointment booked successfully!');
      navigate('/app/appointments');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="mt-2 text-sm text-gray-600">
          Schedule an appointment with a healthcare professional
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Doctor
          </label>
          <div className="space-y-3">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedDoctor?.id === doctor.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDoctor(doctor)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{doctor.specialization}</p>
                    <p className="text-sm text-gray-500">
                      {doctor.experience} years of experience
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
            Appointment Date
          </label>
          <input
            {...register('appointmentDate', { required: 'Date is required' })}
            type="date"
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.appointmentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.appointmentDate.message}</p>
          )}
        </div>

        {/* Time Selection */}
        {selectedDate && availableSlots.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableSlots.map((slot) => (
                <label
                  key={slot}
                  className="relative flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    {...register('appointmentTime', { required: 'Time is required' })}
                    type="radio"
                    value={slot}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{slot}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.appointmentTime && (
              <p className="mt-1 text-sm text-red-600">{errors.appointmentTime.message}</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Any specific concerns or questions you'd like to discuss..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/app/appointments')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedDoctor || submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointmentPage;
