import React, { useState } from 'react';
import './PDFViewer.css';

const PDFViewer = ({ pdf, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleLoad = (event) => {
    // This is a simple implementation - in a real app you'd want to get page count from the PDF
    setTotalPages(1); // Default to 1 page
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-header">
          <h3>{pdf.name}</h3>
          <div className="pdf-controls">
            <button 
              onClick={handlePreviousPage} 
              disabled={currentPage <= 1}
              className="page-button"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage >= totalPages}
              className="page-button"
            >
              Next
            </button>
            <button onClick={onClose} className="close-button">
              Close
            </button>
          </div>
        </div>
        <div className="pdf-content">
          <iframe
            src={pdf.url}
            title={pdf.name}
            className="pdf-iframe"
            onLoad={handleLoad}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
