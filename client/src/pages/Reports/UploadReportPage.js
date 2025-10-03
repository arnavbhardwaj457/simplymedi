import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const UploadReportPage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('report', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Report uploaded successfully! Processing will begin shortly.');
      navigate(`/app/reports/${response.data.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [navigate]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Medical Report</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload your medical report and we'll simplify it for better understanding.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {uploading ? (
            <div className="text-center">
              <LoadingSpinner />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Uploading Report</h3>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we upload your report...
              </p>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{uploadProgress}% complete</p>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your file here' : 'Upload your medical report'}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your file here, or click to select a file
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports PDF, PNG, JPG, JPEG, GIF, BMP, and TIFF files
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Upload Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Supported formats: PDF, PNG, JPG, JPEG, GIF, BMP, TIFF</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Ensure the document is clear and readable</li>
          <li>• For best results, use high-quality scans or photos</li>
          <li>• Processing may take a few minutes depending on file size</li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Privacy & Security</h3>
        <p className="text-sm text-gray-600">
          Your medical reports are processed securely and stored encrypted. We use advanced AI 
          to simplify medical terminology while maintaining the accuracy of your health information. 
          All data is handled in compliance with HIPAA and GDPR regulations.
        </p>
      </div>
    </div>
  );
};

export default UploadReportPage;
