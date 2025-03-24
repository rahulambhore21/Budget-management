import { useState } from 'react';
import './GstCalculator.css';

const GstDetails = ({ transaction }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!transaction || !transaction.amount || transaction.amount <= 0) {
    return null;
  }
  
  // Calculate GST components
  const { amount, gstRate } = transaction;
  const baseAmount = amount * 100 / (100 + gstRate);
  const gstAmount = amount - baseAmount;
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="gst-details-container">
      <button 
        type="button" 
        className="gst-toggle-button"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Hide GST Details' : 'Show GST Details'} 
        <span className="toggle-icon">{showDetails ? '▲' : '▼'}</span>
      </button>
      
      {showDetails && (
        <div className="gst-breakdown">
          <div className="gst-row">
            <span className="gst-label">Base Amount (Pre-GST):</span>
            <span className="gst-value">{formatCurrency(baseAmount)}</span>
          </div>
          <div className="gst-row">
            <span className="gst-label">GST ({gstRate}%):</span>
            <span className="gst-value">{formatCurrency(gstAmount)}</span>
          </div>
          <div className="gst-row total">
            <span className="gst-label">Total Amount (With GST):</span>
            <span className="gst-value">{formatCurrency(amount)}</span>
          </div>
          
          <div className="gst-info">
            <p>GST calculation is based on the category selected.</p>
            <ul>
              <li>Food: 5% GST</li>
              <li>Transport: 12% GST</li>
              <li>Shopping: 18% GST</li>
              <li>Bills, Investment: 0% GST</li>
              <li>Other: 18% GST</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default GstDetails;
