import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  doctor: null,
  tokens: {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  },
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        doctor: action.payload.doctor || null,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        doctor: null,
        tokens: { accessToken: null, refreshToken: null },
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        doctor: null,
        tokens: { accessToken: null, refreshToken: null },
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    case 'UPDATE_DOCTOR':
      return {
        ...state,
        doctor: { ...state.doctor, ...action.payload },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios interceptors
  useEffect(() => {
    const setupInterceptors = () => {
      // Request interceptor to add auth token
      api.interceptors.request.use(
        (config) => {
          const token = state.tokens.accessToken;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response interceptor to handle token refresh
      api.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;

          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
              const refreshToken = state.tokens.refreshToken;
              if (refreshToken) {
                const response = await api.post('/auth/refresh', {
                  refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                
                // Update tokens in state and localStorage
                dispatch({
                  type: 'AUTH_SUCCESS',
                  payload: {
                    user: state.user,
                    doctor: state.doctor,
                    tokens: { accessToken, refreshToken: newRefreshToken },
                  },
                });

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              logout();
              return Promise.reject(refreshError);
            }
          }

          return Promise.reject(error);
        }
      );
    };

    setupInterceptors();
  }, [state.tokens, state.user, state.doctor]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          dispatch({ type: 'AUTH_START' });
          
          // Verify token and get user data
          const response = await api.get('/auth/me');
          const { user, doctor } = response.data;

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              doctor,
              tokens: { accessToken, refreshToken },
            },
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Save tokens to localStorage when they change
  useEffect(() => {
    if (state.tokens.accessToken) {
      localStorage.setItem('accessToken', state.tokens.accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }

    if (state.tokens.refreshToken) {
      localStorage.setItem('refreshToken', state.tokens.refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [state.tokens]);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { user, doctor, tokens } = response.data;

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, doctor, tokens },
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await api.post('/auth/register', userData);
      const { user, tokens } = response.data;

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, tokens },
      });

      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const registerDoctor = async (doctorData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await api.post('/auth/register-doctor', doctorData);
      const { user, doctor, tokens } = response.data;

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, doctor, tokens },
      });

      toast.success('Doctor registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Doctor registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const updateDoctor = (doctorData) => {
    dispatch({ type: 'UPDATE_DOCTOR', payload: doctorData });
  };

  const value = {
    ...state,
    login,
    register,
    registerDoctor,
    logout,
    updateUser,
    updateDoctor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
