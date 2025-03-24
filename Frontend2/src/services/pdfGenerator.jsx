import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// Format date for PDF
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Group transactions by category
const groupByCategory = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(transaction);
    return acc;
  }, {});
};

// Group transactions by month
const groupByMonth = (transactions) => {
  return transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    
    acc[monthKey].push(transaction);
    return acc;
  }, {});
};

// Generate and download an annual report
export const downloadAnnualReport = (transactions, year) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Filter transactions for the selected year
  const yearTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getFullYear() === parseInt(year);
  });
  
  // Group transactions by month and category
  const transactionsByMonth = groupByMonth(yearTransactions);
  const transactionsByCategory = groupByCategory(yearTransactions);
  
  // Add title
  doc.setFontSize(22);
  doc.setTextColor(76, 175, 80); // Green color
  doc.text(`Annual Expense Report - ${year}`, 105, 20, { align: 'center' });
  
  // Add subtitle
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100); // Gray color
  doc.text(`Generated on ${formatDate(new Date())}`, 105, 30, { align: 'center' });
  
  // Add summary section
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Annual Summary', 14, 45);
  
  // Calculate total expense
  const totalExpense = yearTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Summary table
  autoTable(doc, {
    startY: 50,
    head: [['Category', 'Amount', 'Percentage']],
    body: Object.entries(transactionsByCategory).map(([category, txs]) => {
      const categoryTotal = txs.reduce((sum, tx) => sum + tx.amount, 0);
      const percentage = ((categoryTotal / totalExpense) * 100).toFixed(1);
      return [
        category,
        formatCurrency(categoryTotal),
        `${percentage}%`
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80] }
  });
  
  // Get position after first table
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
  
  // Monthly breakdown section
  doc.text('Monthly Breakdown', 14, currentY);
  currentY += 10;
  
  // Monthly expense table
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthlyData = months.map(month => {
    const monthIndex = months.indexOf(month);
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthTxs = transactionsByMonth[monthKey] || [];
    const monthTotal = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);
    return [month, formatCurrency(monthTotal)];
  });
  
  autoTable(doc, {
    startY: currentY,
    head: [['Month', 'Total Expense']],
    body: monthlyData,
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80] }
  });
  
  // Get position after second table
  currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : currentY + 100;
  
  // Top expenses section
  doc.text('Top Expenses', 14, currentY);
  currentY += 10;
  
  // Sort transactions by amount
  const topTransactions = [...yearTransactions].sort((a, b) => b.amount - a.amount).slice(0, 10);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: topTransactions.map(tx => [
      formatDate(tx.date),
      tx.category,
      tx.description || 'No description',
      formatCurrency(tx.amount)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80] }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `RupeeRakshak - Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`Annual_Report_${year}.pdf`);
  
  return doc;
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
  
  autoTable(doc, {
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
  
  autoTable(doc, {
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

// Download monthly statement as PDF
export const downloadMonthlyStatement = (transactions, month, year) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(`Monthly Financial Statement`, 105, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`${month} ${year}`, 105, 23, { align: 'center' });
  
  // Date generated
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatDate(new Date())}`, 195, 10, { align: 'right' });
  
  // Calculate summary
  const totalExpense = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const categoryGroups = groupByCategory(transactions);
  const categories = Object.keys(categoryGroups);
  
  // Summary section
  doc.setFontSize(14);
  doc.text('Monthly Summary', 14, 35);
  
  doc.setFontSize(12);
  doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 14, 45);
  doc.text(`Total Transactions: ${transactions.length}`, 14, 53);
  
  // Category breakdown
  doc.setFontSize(14);
  doc.text('Category Breakdown', 14, 65);
  
  const categoryBreakdownData = categories.map(category => {
    const categoryTotal = categoryGroups[category].reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = (categoryTotal / totalExpense * 100).toFixed(1);
    return [
      category,
      formatCurrency(categoryTotal),
      `${percentage}%`
    ];
  });
  
  autoTable(doc, {
    startY: 70,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryBreakdownData,
  });
  
  // Transactions list
  const yPos = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Transaction Details', 14, yPos);
  
  const transactionData = transactions.map(tx => [
    formatDate(tx.date),
    tx.category,
    tx.description || 'No description',
    tx.paymentMode,
    formatCurrency(tx.amount)
  ]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Date', 'Category', 'Description', 'Payment Mode', 'Amount']],
    body: transactionData,
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
    doc.text('RupeeRakshak - Your Personal Budget Assistant', 105, 295, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`Monthly_Statement_${month}_${year}.pdf`);
  
  return doc;
};

// Download custom date range report
export const downloadCustomReport = (transactions, startDate, endDate, title = 'Custom Report') => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(`${title}`, 105, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`${formatDate(startDate)} to ${formatDate(endDate)}`, 105, 23, { align: 'center' });
  
  // Date generated
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatDate(new Date())}`, 195, 10, { align: 'right' });
  
  // Filter transactions for the date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= start && txDate <= end;
  });
  
  // Calculate summary
  const totalExpense = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const categoryGroups = groupByCategory(filteredTransactions);
  
  // Summary section
  doc.setFontSize(14);
  doc.text('Summary', 14, 35);
  
  doc.setFontSize(12);
  doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 14, 45);
  doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 53);
  
  // Category breakdown
  doc.setFontSize(14);
  doc.text('Category Breakdown', 14, 65);
  
  const categories = Object.keys(categoryGroups);
  const categoryData = categories.map(category => {
    const categoryTotal = categoryGroups[category].reduce((sum, tx) => sum + tx.amount, 0);
    return [
      category,
      formatCurrency(categoryTotal),
      `${((categoryTotal / totalExpense) * 100).toFixed(1)}%`
    ];
  });
  
  autoTable(doc, {
    startY: 70,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData,
  });
  
  // Transactions list
  const yPos = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Transaction Details', 14, yPos);
  
  const transactionData = filteredTransactions.map(tx => [
    formatDate(tx.date),
    tx.category,
    tx.description || 'No description',
    tx.paymentMode,
    formatCurrency(tx.amount)
  ]);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Date', 'Category', 'Description', 'Payment Mode', 'Amount']],
    body: transactionData,
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
    doc.text('RupeeRakshak - Your Personal Budget Assistant', 105, 295, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);
  
  return doc;
};
