import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ReportDetailPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [simplifiedReport, setSimplifiedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      const response = await api.get(`/reports/${id}`);
      setReport(response.data);
      
      if (response.data.simplifiedReport) {
        setSimplifiedReport(response.data.simplifiedReport);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/reports/${id}/download`);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Report not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The report you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/app/reports"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Reports
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
            to="/app/reports"
            className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{report.originalFileName}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Report */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Original Report</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">File Name</label>
              <p className="mt-1 text-sm text-gray-900">{report.originalFileName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">File Type</label>
              <p className="mt-1 text-sm text-gray-900">{report.fileType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
            {report.extractedText && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Extracted Text</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {report.extractedText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simplified Report */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Simplified Report</h2>
          {simplifiedReport ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Simplified Text</label>
                <div className="mt-1 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {simplifiedReport.simplifiedText}
                  </p>
                </div>
              </div>
              
              {simplifiedReport.keyFindings && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Key Findings</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {simplifiedReport.keyFindings}
                    </p>
                  </div>
                </div>
              )}

              {simplifiedReport.recommendations && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recommendations</label>
                  <div className="mt-1 p-3 bg-yellow-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {simplifiedReport.recommendations}
                    </p>
                  </div>
                </div>
              )}

              {simplifiedReport.riskLevel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    simplifiedReport.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    simplifiedReport.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {simplifiedReport.riskLevel.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No simplified version</h3>
              <p className="mt-1 text-sm text-gray-500">
                {report.status === 'processing' 
                  ? 'Report is being processed...'
                  : 'Simplified version is not available.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
