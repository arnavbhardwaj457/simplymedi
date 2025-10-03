import React, { createContext, useContext, useReducer } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length,
        isLoading: false,
        error: null,
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: state.notifications.filter(n => n.id !== action.payload && !n.isRead).length,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const showNotification = (notification) => {
    const { type, title, message, duration = 4000, action } = notification;
    
    // Add to context
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: Date.now().toString(),
        type,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
        action,
      },
    });

    // Show toast
    const toastOptions = {
      duration,
      position: 'top-right',
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
      case 'info':
        toast(message, { ...toastOptions, icon: 'ℹ️' });
        break;
      default:
        toast(message, toastOptions);
    }
  };

  const showSuccess = (message, title = 'Success') => {
    showNotification({ type: 'success', title, message });
  };

  const showError = (message, title = 'Error') => {
    showNotification({ type: 'error', title, message });
  };

  const showWarning = (message, title = 'Warning') => {
    showNotification({ type: 'warning', title, message });
  };

  const showInfo = (message, title = 'Info') => {
    showNotification({ type: 'info', title, message });
  };

  const markAsRead = (notificationId) => {
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const removeNotification = (notificationId) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
  };

  const clearAll = () => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
  };

  // System notifications for common events
  const notifyReportUploaded = (fileName) => {
    showSuccess(
      `Report "${fileName}" has been uploaded and is being processed.`,
      'Report Uploaded'
    );
  };

  const notifyReportProcessed = (fileName) => {
    showSuccess(
      `Report "${fileName}" has been processed successfully.`,
      'Report Ready'
    );
  };

  const notifyReportError = (fileName, error) => {
    showError(
      `Failed to process report "${fileName}": ${error}`,
      'Processing Error'
    );
  };

  const notifyAppointmentBooked = (doctorName, date) => {
    showSuccess(
      `Appointment with Dr. ${doctorName} booked for ${date}`,
      'Appointment Booked'
    );
  };

  const notifyAppointmentCancelled = (doctorName, date) => {
    showInfo(
      `Appointment with Dr. ${doctorName} on ${date} has been cancelled.`,
      'Appointment Cancelled'
    );
  };

  const notifyAppointmentReminder = (doctorName, time) => {
    showInfo(
      `Reminder: You have an appointment with Dr. ${doctorName} in ${time}`,
      'Appointment Reminder'
    );
  };

  const notifyChatResponse = () => {
    showInfo('New response from AI assistant', 'Chat Update');
  };

  const notifyProfileUpdated = () => {
    showSuccess('Your profile has been updated successfully.', 'Profile Updated');
  };

  const notifySettingsUpdated = () => {
    showSuccess('Your settings have been updated successfully.', 'Settings Updated');
  };

  const notifyLanguageChanged = (language) => {
    showInfo(`Language changed to ${language}`, 'Language Updated');
  };

  const notifyAccessibilityToggle = (feature, enabled) => {
    showInfo(
      `${feature} ${enabled ? 'enabled' : 'disabled'}`,
      'Accessibility Updated'
    );
  };

  const value = {
    ...state,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    // System notifications
    notifyReportUploaded,
    notifyReportProcessed,
    notifyReportError,
    notifyAppointmentBooked,
    notifyAppointmentCancelled,
    notifyAppointmentReminder,
    notifyChatResponse,
    notifyProfileUpdated,
    notifySettingsUpdated,
    notifyLanguageChanged,
    notifyAccessibilityToggle,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
