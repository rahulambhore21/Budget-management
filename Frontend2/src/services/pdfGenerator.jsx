import { getTransactions } from './transaction';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Helper to group transactions by date
export const groupTransactionsByMonth = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(transaction);
    return acc;
  }, {});
};

// Helper to group transactions by category
export const groupTransactionsByCategory = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const { category } = transaction;
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push(transaction);
    return acc;
  }, {});
};

// Calculate GST amounts by category
export const calculateGstByCategory = (transactions) => {
  const categories = groupTransactionsByCategory(transactions);
  
  return Object.keys(categories).reduce((acc, category) => {
    const txs = categories[category];
    
    const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const gstRate = txs[0].gstRate || 0;
    const gstAmount = (totalAmount * gstRate) / (100 + gstRate);
    
    acc[category] = {
      total: totalAmount,
      gstRate,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      baseAmount: parseFloat((totalAmount - gstAmount).toFixed(2))
    };
    
    return acc;
  }, {});
};

// Format date for reports
export const formatDateForReport = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get transaction data for annual report
export const getAnnualReportData = async (year) => {
  try {
    const response = await getTransactions();
    if (!response || !response.data || !Array.isArray(response.data.transactions)) {
      throw new Error('Invalid transaction data format');
    }

    // Filter transactions for the specified year
    const transactions = response.data.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === year;
    });

    // Group transactions by month and category
    const monthlyData = groupTransactionsByMonth(transactions);
    const categoryData = groupTransactionsByCategory(transactions);
    const gstData = calculateGstByCategory(transactions);

    // Calculate totals
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalGST = Object.values(gstData).reduce((sum, cat) => sum + cat.gstAmount, 0);

    return {
      transactions,
      monthlyData,
      categoryData,
      gstData,
      totalAmount,
      totalGST,
      year
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Generate monthly expense report
export const generateMonthlyReport = (transactions, month, year) => {
  const doc = new jsPDF();
  const title = `Monthly Expense Report - ${format(new Date(year, month, 1), 'MMMM yyyy')}`;
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(76, 175, 80); // Primary color
  doc.text(title, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text('RupeeRakshak - Your Financial Assistant', 105, 30, { align: 'center' });
  doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 38, { align: 'center' });
  
  // Filter transactions for the selected month and year
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === month && txDate.getFullYear() === year;
  });
  
  // Calculate summary data
  const totalExpense = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const categoryTotals = filteredTransactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Summary', 14, 50);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Expenses: ${formatCurrency(totalExpense)}`, 14, 60);
  doc.text(`Number of Transactions: ${filteredTransactions.length}`, 14, 68);
  
  // Add category breakdown
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Category Breakdown', 14, 82);
  
  const categoryData = Object.entries(categoryTotals).map(([category, amount]) => [
    category,
    formatCurrency(amount),
    `${((amount / totalExpense) * 100).toFixed(1)}%`
  ]);
  
  doc.autoTable({
    startY: 88,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });
  
  // Add transactions table
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Transactions', 14, doc.lastAutoTable.finalY + 20);
  
  const transactionData = filteredTransactions.map(tx => [
    format(new Date(tx.date), 'dd/MM/yyyy'),
    tx.category,
    tx.description || '-',
    tx.paymentMode,
    formatCurrency(tx.amount)
  ]);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 26,
    head: [['Date', 'Category', 'Description', 'Payment Mode', 'Amount']],
    body: transactionData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'RupeeRakshak - Confidential Financial Report',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10
    );
  }
  
  return doc;
};

// Generate annual expense report
export const generateAnnualReport = (transactions, year) => {
  const doc = new jsPDF();
  const title = `Annual Expense Report - ${year}`;
  
  // Add header
  doc.setFontSize(18);
  doc.setTextColor(76, 175, 80); // Primary color
  doc.text(title, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  doc.text('RupeeRakshak - Your Financial Assistant', 105, 30, { align: 'center' });
  doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 38, { align: 'center' });
  
  // Filter transactions for the selected year
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getFullYear() === year;
  });
  
  // Calculate summary data
  const totalExpense = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Calculate monthly breakdown
  const monthlyData = {};
  filteredTransactions.forEach(tx => {
    const month = new Date(tx.date).getMonth();
    monthlyData[month] = (monthlyData[month] || 0) + tx.amount;
  });
  
  // Calculate category breakdown
  const categoryTotals = filteredTransactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Annual Summary', 14, 50);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Annual Expenses: ${formatCurrency(totalExpense)}`, 14, 60);
  doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 68);
  doc.text(`Average Monthly Expense: ${formatCurrency(totalExpense / 12)}`, 14, 76);
  
  // Add monthly breakdown
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Monthly Breakdown', 14, 90);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthlyTableData = monthNames.map((name, index) => [
    name,
    formatCurrency(monthlyData[index] || 0),
    `${((monthlyData[index] || 0) / totalExpense * 100).toFixed(1)}%`
  ]);
  
  doc.autoTable({
    startY: 96,
    head: [['Month', 'Expenses', 'Percentage']],
    body: monthlyTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });
  
  // Add category breakdown
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Category Breakdown', 14, doc.lastAutoTable.finalY + 20);
  
  const categoryData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]) // Sort by amount (descending)
    .map(([category, amount]) => [
      category,
      formatCurrency(amount),
      `${((amount / totalExpense) * 100).toFixed(1)}%`
    ]);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 26,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'RupeeRakshak - Confidential Financial Report',
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10
    );
  }
  
  return doc;
};

// Save PDF with a generated filename
export const savePdf = (doc, reportType, period) => {
  const fileName = `RupeeRakshak_${reportType}_Report_${period}.pdf`;
  doc.save(fileName);
  return fileName;
};

// Generate and download a monthly report
export const downloadMonthlyReport = (transactions, month, year) => {
  const doc = generateMonthlyReport(transactions, month, year);
  const monthName = format(new Date(year, month, 1), 'MMMM');
  return savePdf(doc, 'Monthly', `${monthName}_${year}`);
};

// Generate and download an annual report
export const downloadAnnualReport = (transactions, year) => {
  const doc = generateAnnualReport(transactions, year);
  return savePdf(doc, 'Annual', year);
};
