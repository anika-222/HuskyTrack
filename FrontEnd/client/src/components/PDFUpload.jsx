import React, { useState } from 'react';
import './PDFUpload.css';

const PDFUpload = ({ onUploadSuccess, uploadType = "PDF" }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus('');
    } else {
      setUploadStatus('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await fetch('http://localhost:5001/upload/pdf', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`Successfully uploaded: ${result.originalName}`);
        setSelectedFile(null);
        document.getElementById(`pdf-input-${uploadType}`).value = '';
        
        if (onUploadSuccess) {
          onUploadSuccess({
            name: result.originalName,
            url: `http://localhost:5001/uploads/${result.filename}`,
            type: uploadType.toLowerCase(),
            parsedData: result.parsedData || null
          });
        }
      } else {
        const error = await response.json();
        setUploadStatus(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pdf-upload-container">
      <h3>Upload {uploadType}</h3>
      <div className="upload-section">
        <input
          id={`pdf-input-${uploadType}`}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : `Upload ${uploadType}`}
        </button>
      </div>
      {uploadStatus && (
        <div className={`status-message ${uploadStatus.includes('Successfully') ? 'success' : 'error'}`}
        >
          {uploadStatus}
        </div>
      )}
      {selectedFile && (
        <div className="file-info">
          <p>Selected file: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
};

export default PDFUpload;
