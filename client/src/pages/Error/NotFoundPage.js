import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-indigo-600">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/app"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
