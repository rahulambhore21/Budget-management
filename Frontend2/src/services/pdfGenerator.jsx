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
    maximumFractionDigits: 2
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

// Add common PDF styling elements
const addPdfStyling = (doc, title, subtitle = null) => {
  // Add header with gradient
  doc.setFillColor(76, 175, 80, 0.1);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  // Add border line
  doc.setDrawColor(76, 175, 80);
  doc.setLineWidth(0.5);
  doc.line(0, 40, doc.internal.pageSize.width, 40);
  
  // Add title
  doc.setFontSize(22);
  doc.setTextColor(56, 142, 60);
  doc.text(title, 105, 20, { align: 'center' });
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 105, 30, { align: 'center' });
  }
  
  // Add RupeeRakshak logo placeholder
  doc.setFillColor(76, 175, 80);
  doc.roundedRect(14, 10, 30, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('RUPEE', 29, 20, { align: 'center' });
  doc.text('RAKSHAK', 29, 25, { align: 'center' });
  
  return doc;
};

// Add enhanced footer to the document
const addEnhancedFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add footer background
    doc.setFillColor(240, 240, 240);
    doc.rect(0, doc.internal.pageSize.height - 20, doc.internal.pageSize.width, 20, 'F');
    
    // Add border line
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(0.5);
    doc.line(0, doc.internal.pageSize.height - 20, doc.internal.pageSize.width, doc.internal.pageSize.height - 20);
    
    // Add page numbers
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10
    );
    
    // Add company text
    doc.setTextColor(76, 175, 80);
    doc.text(
      'RupeeRakshak - Your Financial Assistant',
      20,
      doc.internal.pageSize.height - 10
    );
  }
  
  return doc;
};

// Generate and download an annual report with enhanced UI
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
  
  // Add styled header
  addPdfStyling(
    doc, 
    `Annual Expense Report - ${year}`, 
    `Generated on ${formatDate(new Date())}`
  );
  
  // Add summary section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Annual Summary', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
  // Calculate total expense
  const totalExpense = yearTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Add total expense info
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Annual Expense: ${formatCurrency(totalExpense)}`, 14, 65);
  doc.text(`Total Transactions: ${yearTransactions.length}`, 14, 72);
  
  // Summary table with enhanced styling
  autoTable(doc, {
    startY: 80,
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
    headStyles: { 
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'center' }
    },
    margin: { top: 80 },
    styles: {
      cellPadding: 5,
      fontSize: 10
    }
  });
  
  // Get position after first table
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
  
  // Monthly breakdown section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Monthly Breakdown', 14, currentY);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 3, 80, currentY + 3);
  
  currentY += 10;
  
  // Monthly expense table with enhanced styling
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
    headStyles: { 
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    }
  });
  
  // Get position after second table
  currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : currentY + 100;
  
  // Check if we need a new page for the top expenses section
  if (currentY > doc.internal.pageSize.height - 80) {
    doc.addPage();
    currentY = 20;
  }
  
  // Top expenses section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Top Expenses', 14, currentY);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 3, 80, currentY + 3);
  
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
    headStyles: { 
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      3: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    }
  });
  
  // Add enhanced footer
  addEnhancedFooter(doc);
  
  // Save the PDF
  doc.save(`Annual_Report_${year}.pdf`);
  
  return doc;
};

// Generate monthly expense report with enhanced UI
export const generateMonthlyReport = (transactions, month, year) => {
  const doc = new jsPDF();
  const title = `Monthly Expense Report`;
  const subtitle = `${format(new Date(year, month, 1), 'MMMM yyyy')}`;
  
  // Add header styling
  addPdfStyling(doc, title, subtitle);
  
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
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Expense Summary', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
  // Add summary information with better formatting
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Expenses: ${formatCurrency(totalExpense)}`, 14, 65);
  doc.text(`Number of Transactions: ${filteredTransactions.length}`, 14, 72);
  
  // Add expense trend visual indicator (simplified)
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(130, 55, 65, 25, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Monthly Average:', 135, 65);
  doc.setFontSize(12);
  doc.setTextColor(56, 142, 60);
  doc.text(`${formatCurrency(totalExpense)}`, 162, 72);
  
  // Add category breakdown
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Category Breakdown', 14, 90);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 93, 80, 93);
  
  const categoryData = Object.entries(categoryTotals).map(([category, amount]) => [
    category,
    formatCurrency(amount),
    `${((amount / totalExpense) * 100).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: 100,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    }
  });
  
  // Add transactions table
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Transaction Details', 14, doc.lastAutoTable.finalY + 20);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, doc.lastAutoTable.finalY + 23, 80, doc.lastAutoTable.finalY + 23);
  
  const transactionData = filteredTransactions.map(tx => [
    format(new Date(tx.date), 'dd/MM/yyyy'),
    tx.category,
    tx.description || '-',
    tx.paymentMode,
    formatCurrency(tx.amount)
  ]);
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 30,
    head: [['Date', 'Category', 'Description', 'Payment Mode', 'Amount']],
    body: transactionData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      4: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10,
      overflow: 'ellipsize',
      cellWidth: 'wrap'
    }
  });
  
  // Add enhanced footer
  addEnhancedFooter(doc);
  
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

// Download custom date range report with enhanced UI
export const downloadCustomReport = (transactions, startDate, endDate, title = 'Custom Report') => {
  const doc = new jsPDF();
  
  // Add styled header
  addPdfStyling(
    doc,
    title,
    `${formatDate(startDate)} to ${formatDate(endDate)}`
  );
  
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
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Expense Summary', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 14, 65);
  doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 72);
  doc.text(`Date Range: ${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`, 14, 79);
  
  // Category breakdown
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Category Breakdown', 14, 90);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 93, 80, 93);
  
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
    startY: 100,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10
    }
  });
  
  // Transactions list
  const yPos = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Transaction Details', 14, yPos);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 3, 80, yPos + 3);
  
  const transactionData = filteredTransactions.map(tx => [
    formatDate(tx.date),
    tx.category,
    tx.description || '-',
    tx.paymentMode,
    formatCurrency(tx.amount)
  ]);
  
  autoTable(doc, {
    startY: yPos + 10,
    head: [['Date', 'Category', 'Description', 'Payment Mode', 'Amount']],
    body: transactionData,
    theme: 'grid',
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      4: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10,
      overflow: 'ellipsize',
      cellWidth: 'wrap'
    }
  });
  
  // Add enhanced footer
  addEnhancedFooter(doc);
  
  // Save the PDF
  doc.save(`${title.replace(/\s+/g, '_')}_${format(start, 'yyyyMMdd')}_to_${format(end, 'yyyyMMdd')}.pdf`);
  
  return doc;
};
