import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useState, useEffect } from 'react';
import { downloadAnnualReport } from '../../services/pdfGenerator';
import { toast } from 'react-hot-toast';

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #4CAF50',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#e8f5e9',
    padding: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bdbdbd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bdbdbd',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bdbdbd',
    backgroundColor: '#f5f5f5',
  },
  tableCol: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#bdbdbd',
  },
  tableColLast: {
    padding: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  summaryItemTitle: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  summaryItemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#757575',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
});

// Format currency for PDF
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date for PDF
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AnnualReportPDF = ({ transactions, year, onGenerateStart, onGenerateComplete }) => {
  const [generating, setGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState(null);
  
  useEffect(() => {
    // Clear report URL when year changes
    setReportUrl(null);
  }, [year]);
  
  const generateReport = async () => {
    if (generating) return;
    
    if (!transactions || transactions.length === 0) {
      toast.error('No transaction data available for this year');
      return;
    }
    
    setGenerating(true);
    if (onGenerateStart) onGenerateStart();
    
    try {
      // Generate the report directly without setTimeout
      const doc = downloadAnnualReport(transactions, year);
      toast.success(`Annual report for ${year} has been downloaded`);
    } catch (error) {
      console.error('Error generating annual report:', error);
      toast.error(`Failed to generate report: ${error.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
      if (onGenerateComplete) onGenerateComplete();
    }
  };
  
  return (
    <div className="report-generator">
      <div className="report-options">
        <h4>Annual Report for {year}</h4>
        <p>
          This report includes a comprehensive summary of all your transactions for the 
          year {year}, categorized by month and expense category, with spending analysis.
        </p>
      </div>
      
      <button
        className="generate-btn"
        onClick={generateReport}
        disabled={generating}
      >
        {generating ? 'Generating PDF...' : 'Download Annual Report'}
      </button>
      
      {generating && (
        <div className="generating-message">
          <div className="spinner"></div>
          <p>Generating your annual report. This may take a few moments...</p>
        </div>
      )}
    </div>
  );
};

export default AnnualReportPDF;
