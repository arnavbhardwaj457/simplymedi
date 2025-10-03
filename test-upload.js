const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // Create a test file buffer
    const testContent = 'This is a test file for upload functionality';
    const testFile = Buffer.from(testContent);

    const formData = new FormData();
    formData.append('file', testFile, {
      filename: 'test-report.txt',
      contentType: 'text/plain'
    });

    console.log('Testing upload without authentication...');
    
    const response = await axios.post('http://localhost:5000/api/reports-simple/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Upload successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Upload failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpload();