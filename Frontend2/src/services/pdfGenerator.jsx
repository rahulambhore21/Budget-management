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

// Helper to format currency - fixed for PDF compatibility
const formatCurrency = (amount) => {
  // Format number with Indian thousand separator pattern (2,xx,xxx.xx)
  let amountStr = amount.toFixed(2);
  let [wholePart, decimalPart] = amountStr.split('.');
  
  // Apply Indian currency formatting with commas (e.g., 1,23,456)
  let formattedWholePart = '';
  let digitCount = 0;

  // Process from right to left
  for (let i = wholePart.length - 1; i >= 0; i--) {
    if (digitCount === 3 && formattedWholePart.length > 0) {
      formattedWholePart = ',' + formattedWholePart;
      digitCount = 0;
    } else if (digitCount === 2 && formattedWholePart.length > 3) {
      formattedWholePart = ',' + formattedWholePart;
      digitCount = 0;
    }
    formattedWholePart = wholePart[i] + formattedWholePart;
    digitCount++;
  }
  
  // Return with Rupee symbol
  return `₹${formattedWholePart}.${decimalPart}`;
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
  
  // Add cover page
  addCoverPage(doc, year, yearTransactions);
  
  // Add table of contents
  doc.addPage();
  addTableOfContents(doc);
  
  // Add yearly overview page
  doc.addPage();
  addYearlyOverview(doc, year, yearTransactions, transactionsByCategory);
  
  // Add monthly analysis page
  doc.addPage();
  addMonthlyAnalysis(doc, year, transactionsByMonth);
  
  // Add category breakdown page
  doc.addPage();
  addCategoryBreakdown(doc, transactionsByCategory, yearTransactions);
  
  // Add top expenses page
  doc.addPage();
  addTopExpensesPage(doc, yearTransactions);
  
  // Add enhanced footer to all pages
  addEnhancedFooter(doc);
  
  // Save the PDF
  doc.save(`Annual_Financial_Report_${year}.pdf`);
  
  return doc;
};

// Create an attractive cover page
function addCoverPage(doc, year, transactions) {
  // Add gradient background
  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;
  
  // Draw gradient background (lighter at top, darker at bottom)
  for (let i = 0; i < height; i += 3) {
    const shade = 255 - (i / height * 40); // Subtle gradient
    doc.setFillColor(shade, shade, shade);
    doc.rect(0, i, width, 3, 'F');
  }
  
  // Add header accent
  doc.setFillColor(76, 175, 80, 0.8);
  doc.rect(0, 0, width, 40, 'F');
  
  // Add footer accent
  doc.setFillColor(76, 175, 80, 0.8);
  doc.rect(0, height - 30, width, 30, 'F');
  
  // Add logo
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(width / 2 - 40, 70, 80, 50, 5, 5, 'F');
  doc.setFontSize(22);
  doc.setTextColor(76, 175, 80);
  doc.text('RUPEE', width / 2, 100, { align: 'center' });
  doc.text('RAKSHAK', width / 2, 110, { align: 'center' });
  
  // Add report title
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('ANNUAL FINANCIAL REPORT', width / 2, 25, { align: 'center' });
  
  // Add year
  doc.setFontSize(50);
  doc.setTextColor(76, 175, 80);
  doc.text(year.toString(), width / 2, 160, { align: 'center' });
  
  // Add decorative line
  doc.setDrawColor(76, 175, 80);
  doc.setLineWidth(1);
  doc.line(width / 2 - 50, 170, width / 2 + 50, 170);
  
  // Calculate total expense
  const totalExpense = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Add financial highlights
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text('Financial Highlights', width / 2, 190, { align: 'center' });
  
  doc.setFontSize(12);
  doc.roundedRect(width / 2 - 80, 200, 160, 60, 3, 3, 'S');
  
  doc.setTextColor(76, 175, 80);
  doc.text('Total Annual Expense:', width / 2 - 70, 215);
  doc.text('Number of Transactions:', width / 2 - 70, 230);
  doc.text('Generated on:', width / 2 - 70, 245);
  
  // Add values with right alignment
  doc.setTextColor(80, 80, 80);
  doc.text(formatCurrency(totalExpense), width / 2 + 70, 215, { align: 'right' });
  doc.text(transactions.length.toString(), width / 2 + 70, 230, { align: 'right' });
  doc.text(formatDate(new Date()), width / 2 + 70, 245, { align: 'right' });
  
  // Add footer text
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENTIAL FINANCIAL DOCUMENT', width / 2, height - 15, { align: 'center' });
}

// Add a table of contents
function addTableOfContents(doc) {
  // Add styled header
  addPdfStyling(doc, 'Table of Contents');
  
  const startY = 60;
  const lineHeight = 12;
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  
  // Table of contents entries
  const entries = [
    { title: '1. Annual Overview', page: 3 },
    { title: '2. Monthly Analysis', page: 4 },
    { title: '3. Category Breakdown', page: 5 },
    { title: '4. Top Expenses', page: 6 }
  ];
  
  entries.forEach((entry, index) => {
    const y = startY + (index * lineHeight);
    
    // Draw bullet point
    doc.setFillColor(76, 175, 80);
    doc.circle(20, y - 2, 2, 'F');
    
    // Draw title
    doc.setTextColor(80, 80, 80);
    doc.text(entry.title, 30, y);
    
    // Draw dots
    doc.setTextColor(180, 180, 180);
    let dotsX = 35 + doc.getTextWidth(entry.title);
    const maxDotsX = 180;
    
    while (dotsX < maxDotsX) {
      doc.text('.', dotsX, y);
      dotsX += 5;
    }
    
    // Draw page number
    doc.setTextColor(76, 175, 80);
    doc.text(entry.page.toString(), 190, y);
  });
  
  // Add note at bottom
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('This report provides a comprehensive overview of your financial activities for the year.', 
    doc.internal.pageSize.width / 2, 250, { align: 'center' });
  doc.text('For any questions or clarifications, please contact support@rupeerakshak.com', 
    doc.internal.pageSize.width / 2, 260, { align: 'center' });
}

// Add the yearly overview page
function addYearlyOverview(doc, year, transactions, transactionsByCategory) {
  // Add styled header
  addPdfStyling(doc, 'Annual Overview', `Financial Year ${year}`);
  
  // Calculate total expense
  const totalExpense = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Add summary section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Annual Summary', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
  // Add total expense info
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Annual Expense: ${formatCurrency(totalExpense)}`, 14, 65);
  doc.text(`Total Transactions: ${transactions.length}`, 14, 72);
  doc.text(`Average Monthly Expense: ${formatCurrency(totalExpense / 12)}`, 14, 79);
  
  // Add visual expense indicator box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(130, 60, 65, 25, 2, 2, 'F');
  doc.setDrawColor(76, 175, 80);
  doc.setLineWidth(0.5);
  doc.roundedRect(130, 60, 65, 25, 2, 2, 'S');
  
  // Add expense trend indicator
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Annual Spending', 145, 70);
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text(formatCurrency(totalExpense), 162, 80);
  
  // Summary table with enhanced styling
  autoTable(doc, {
    startY: 90,
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
    margin: { top: 90 },
    styles: {
      cellPadding: 5,
      fontSize: 10
    }
  });
  
  // Add expense distribution visualization
  let currentY = doc.lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Expense Distribution', 14, currentY);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 3, 80, currentY + 3);
  
  currentY += 10;
  
  // Set up for expense distribution visualization
  const centerX = 105;
  const centerY = currentY + 50;
  const radius = 40;
  
  // Category colors map
  const categoryColors = {
    'Food': [255, 99, 132],
    'Housing': [54, 162, 235],
    'Transportation': [255, 206, 86],
    'Utilities': [75, 192, 192],
    'Healthcare': [153, 102, 255],
    'Entertainment': [255, 159, 64],
    'Shopping': [255, 99, 71],
    'Insurance': [100, 149, 237],
    'Debt': [50, 205, 50],
    'Education': [219, 112, 147],
    'Travel': [106, 90, 205],
    'Miscellaneous': [128, 128, 128]
  };
  
  // Default color for categories not in the predefined list
  const defaultColor = [150, 150, 150];
  
  // Convert category data to array for processing
  const categoryData = Object.entries(transactionsByCategory).map(([category, txs]) => {
    const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const percentage = total / totalExpense;
    const color = categoryColors[category] || defaultColor;
    return { category, total, percentage, color };
  });
  
  // Draw colored squares instead of pie chart (more reliable)
  // This is a simpler but effective alternative to the pie chart
  const squareSize = 15;
  const squaresPerRow = 5;
  const gapBetweenSquares = 3;
  let rowCount = 0;
  let columnCount = 0;
  
  // Calculate total squares needed based on percentages (up to 100 squares)
  const totalSquares = 100;
  let squaresDrawn = 0;
  
  // Track how many squares each category should get
  const categorySquares = categoryData.map(cat => {
    return {
      ...cat,
      squares: Math.max(1, Math.round(cat.percentage * totalSquares))
    };
  });
  
  // Draw squares in grid pattern - gives visual representation of percentages
  for (const cat of categorySquares) {
    for (let i = 0; i < cat.squares && squaresDrawn < totalSquares; i++) {
      const xPos = centerX - (radius + 10) + (columnCount * (squareSize + gapBetweenSquares));
      const yPos = currentY + 30 + (rowCount * (squareSize + gapBetweenSquares));
      
      doc.setFillColor(cat.color[0], cat.color[1], cat.color[2]);
      doc.rect(xPos, yPos, squareSize, squareSize, 'F');
      
      columnCount++;
      if (columnCount >= squaresPerRow) {
        columnCount = 0;
        rowCount++;
      }
      
      squaresDrawn++;
    }
  }
  
  // Draw legend
  const legendX = 170;
  const legendY = currentY + 20;
  const legendSpacing = 15;
  
  doc.setFontSize(10);
  
  categoryData.forEach((cat, index) => {
    const y = legendY + (index * legendSpacing);
    
    // Skip if we run out of space
    if (y > centerY + radius + 30) return;
    
    const percentage = (cat.percentage * 100).toFixed(1);
    
    // Draw color box
    doc.setFillColor(cat.color[0], cat.color[1], cat.color[2]);
    doc.rect(legendX, y - 5, 5, 5, 'F');
    
    // Draw category name and percentage
    doc.setTextColor(80, 80, 80);
    doc.text(`${cat.category} (${percentage}%)`, legendX + 8, y);
  });
  
  // Add a title for the visualization
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Each square represents approximately 1% of your total expenses", centerX, currentY + 20, { align: 'center' });
}

// Add monthly analysis page
function addMonthlyAnalysis(doc, year, transactionsByMonth) {
  // Add styled header
  addPdfStyling(doc, 'Monthly Analysis', `Trends for ${year}`);
  
  // Monthly breakdown section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Monthly Expense Trends', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
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
    return [month, formatCurrency(monthTotal), monthTxs.length];
  });
  
  autoTable(doc, {
    startY: 65,
    head: [['Month', 'Total Expense', 'Transactions']],
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
  
  // Draw monthly expense bar chart
  let currentY = doc.lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Monthly Expense Chart', 14, currentY);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 3, 80, currentY + 3);
  
  currentY += 15;
  
  // Calculate max value for the chart
  const monthlyAmounts = monthlyData.map(row => parseFloat(row[1].replace(/[^0-9.-]+/g, '')));
  const maxAmount = Math.max(...monthlyAmounts, 1); // Ensure at least 1 for empty months
  
  // Chart parameters
  const chartStartX = 30;
  const chartWidth = 150;
  const chartHeight = 100;
  const chartEndY = currentY + chartHeight;
  
  // Draw Y axis
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(chartStartX, currentY, chartStartX, chartEndY);
  
  // Draw X axis
  doc.line(chartStartX, chartEndY, chartStartX + chartWidth, chartEndY);
  
  // Draw bars
  const barWidth = chartWidth / 12;
  const barSpacing = barWidth * 0.2;
  const actualBarWidth = barWidth - barSpacing;
  
  monthlyData.forEach((monthData, index) => {
    const amount = parseFloat(monthData[1].replace(/[^0-9.-]+/g, ''));
    const barHeight = (amount / maxAmount) * chartHeight;
    const barStartX = chartStartX + (index * barWidth);
    
    doc.setFillColor(76, 175, 80, 0.7);
    doc.rect(barStartX, chartEndY - barHeight, actualBarWidth, barHeight, 'F');
    
    // Add month labels (abbreviated)
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(monthData[0].substring(0, 3), barStartX + (actualBarWidth / 2), chartEndY + 7, {
      align: 'center'
    });
  });
  
  // Add y-axis labels
  for (let i = 0; i <= 4; i++) {
    const value = (maxAmount * i / 4);
    const yPos = chartEndY - (chartHeight * i / 4);
    
    // Draw horizontal grid line
    doc.setDrawColor(200, 200, 200, 0.5);
    doc.setLineWidth(0.2);
    doc.line(chartStartX, yPos, chartStartX + chartWidth, yPos);
    
    // Add label
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(formatCurrency(value), chartStartX - 5, yPos, { align: 'right' });
  }
  
  // Add insights section
  currentY = chartEndY + 30;
  
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Monthly Insights', 14, currentY);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 3, 80, currentY + 3);
  
  currentY += 15;
  
  // Calculate insights
  const totalSpent = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
  const avgMonthly = totalSpent / 12;
  
  // Find highest and lowest spending months
  let highestMonth = { month: '', amount: 0 };
  let lowestMonth = { month: '', amount: Number.MAX_VALUE };
  
  monthlyData.forEach(monthData => {
    const amount = parseFloat(monthData[1].replace(/[^0-9.-]+/g, ''));
    if (amount > highestMonth.amount) {
      highestMonth = { month: monthData[0], amount };
    }
    if (amount < lowestMonth.amount && amount > 0) {
      lowestMonth = { month: monthData[0], amount };
    }
  });
  
  // If no transactions, set lowest to 0
  if (lowestMonth.amount === Number.MAX_VALUE) {
    lowestMonth = { month: 'N/A', amount: 0 };
  }
  
  // Draw insights boxes
  const boxWidth = 85;
  const boxHeight = 40;
  const spacing = 10;
  
  // Highest month box
  doc.setFillColor(76, 175, 80, 0.1);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setDrawColor(76, 175, 80);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(76, 175, 80);
  doc.text('Highest Spending Month', 14 + boxWidth/2, currentY + 12, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(highestMonth.month, 14 + boxWidth/2, currentY + 24, { align: 'center' });
  doc.text(formatCurrency(highestMonth.amount), 14 + boxWidth/2, currentY + 34, { align: 'center' });
  
  // Lowest month box
  doc.setFillColor(76, 175, 80, 0.1);
  doc.roundedRect(14 + boxWidth + spacing, currentY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setDrawColor(76, 175, 80);
  doc.roundedRect(14 + boxWidth + spacing, currentY, boxWidth, boxHeight, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(76, 175, 80);
  doc.text('Lowest Spending Month', 14 + boxWidth + spacing + boxWidth/2, currentY + 12, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(lowestMonth.month, 14 + boxWidth + spacing + boxWidth/2, currentY + 24, { align: 'center' });
  doc.text(formatCurrency(lowestMonth.amount), 14 + boxWidth + spacing + boxWidth/2, currentY + 34, { align: 'center' });
  
  // Average box
  currentY += boxHeight + spacing;
  doc.setFillColor(76, 175, 80, 0.1);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setDrawColor(76, 175, 80);
  doc.roundedRect(14, currentY, boxWidth, boxHeight, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(76, 175, 80);
  doc.text('Monthly Average', 14 + boxWidth/2, currentY + 12, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(formatCurrency(avgMonthly), 14 + boxWidth/2, currentY + 25, { align: 'center' });
  
  // Total box
  doc.setFillColor(76, 175, 80, 0.1);
  doc.roundedRect(14 + boxWidth + spacing, currentY, boxWidth, boxHeight, 3, 3, 'F');
  doc.setDrawColor(76, 175, 80);
  doc.roundedRect(14 + boxWidth + spacing, currentY, boxWidth, boxHeight, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(76, 175, 80);
  doc.text('Total Annual Expenses', 14 + boxWidth + spacing + boxWidth/2, currentY + 12, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(formatCurrency(totalSpent), 14 + boxWidth + spacing + boxWidth/2, currentY + 25, { align: 'center' });
}

// Add category breakdown page
function addCategoryBreakdown(doc, transactionsByCategory, allTransactions) {
  // Add styled header
  addPdfStyling(doc, 'Category Breakdown', 'Detailed Analysis by Spending Category');
  
  // Calculate total expense
  const totalExpense = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Category breakdown section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Category Analysis', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
  // Get top 6 categories for detailed analysis
  const topCategories = Object.entries(transactionsByCategory)
    .map(([category, txs]) => {
      const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
      return { category, total, transactions: txs };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  
  let currentY = 65;
  const boxWidth = 180;
  const boxHeight = 35;
  const spacing = 15;
  
  // Draw category boxes
  topCategories.forEach((cat, index) => {
    const y = currentY + (index * (boxHeight + spacing));
    const percentage = ((cat.total / totalExpense) * 100).toFixed(1);
    
    // Box background
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, y, boxWidth, boxHeight, 3, 3, 'F');
    
    // Category title
    doc.setFontSize(12);
    doc.setTextColor(76, 175, 80);
    doc.text(cat.category, 20, y + 12);
    
    // Transaction count
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`${cat.transactions.length} transactions`, 20, y + 24);
    
    // Total amount
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text(formatCurrency(cat.total), boxWidth - 10, y + 15, { align: 'right' });
    
    // Percentage
    doc.setFontSize(10);
    doc.setTextColor(76, 175, 80);
    doc.text(`${percentage}% of total`, boxWidth - 10, y + 25, { align: 'right' });
    
    // Progress bar background
    const barY = y + 28;
    const barHeight = 3;
    doc.setFillColor(230, 230, 230);
    doc.rect(20, barY, 160, barHeight, 'F');
    
    // Progress bar fill
    doc.setFillColor(76, 175, 80);
    doc.rect(20, barY, 160 * (parseFloat(percentage) / 100), barHeight, 'F');
  });
  
  // Detailed breakdown of a specific category (use the top category)
  if (topCategories.length > 0) {
    currentY = currentY + (6 * (boxHeight + spacing)) + 10;
    
    doc.setFontSize(16);
    doc.setTextColor(56, 142, 60);
    doc.text(`Detailed: ${topCategories[0].category}`, 14, currentY);
    
    // Add decorative line under section title
    doc.setDrawColor(76, 175, 80, 0.5);
    doc.setLineWidth(0.5);
    doc.line(14, currentY + 3, 120, currentY + 3);
    
    currentY += 10;
    
    // Get transactions for top category and sort by amount
    const categoryTransactions = topCategories[0].transactions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 transactions
    
    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'Description', 'Amount']],
      body: categoryTransactions.map(tx => [
        formatDate(tx.date),
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
        0: { cellWidth: 30 },
        2: { halign: 'right', cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      styles: {
        cellPadding: 5,
        fontSize: 10,
        overflow: 'ellipsize'
      }
    });
  }
}

// Add top expenses page
function addTopExpensesPage(doc, transactions) {
  // Add styled header
  addPdfStyling(doc, 'Top Expenses', 'Highest Individual Transactions');
  
  // Top expenses section
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Highest Expenses', 14, 55);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 80, 58);
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('Your largest individual expenses for the year:', 14, 65);
  
  // Sort transactions by amount
  const topTransactions = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15); // Top 15 transactions
  
  autoTable(doc, {
    startY: 75,
    head: [['Date', 'Category', 'Description', 'Payment Mode', 'Amount']],
    body: topTransactions.map(tx => [
      formatDate(tx.date),
      tx.category,
      tx.description || 'No description',
      tx.paymentMode || '-',
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
      4: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    styles: {
      cellPadding: 5,
      fontSize: 10,
      overflow: 'ellipsize'
    }
  });
  
  // Add expenditure tips section
  let currentY = doc.lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setTextColor(56, 142, 60);
  doc.text('Financial Insights', 14, currentY);
  
  // Add decorative line under section title
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.line(14, currentY + 3, 80, currentY + 3);
  
  currentY += 15;
  
  // Create a tips box
  doc.setFillColor(245, 250, 245);
  doc.roundedRect(14, currentY, 180, 70, 3, 3, 'F');
  doc.setDrawColor(76, 175, 80, 0.5);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, currentY, 180, 70, 3, 3, 'S');
  
  // Add light bulb icon (simplified)
  doc.setFillColor(76, 175, 80);
  doc.circle(25, currentY + 15, 5, 'F');
  
  // Add tips title
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text('Smart Spending Tips', 40, currentY + 15);
  
  // Add tips content
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  // Add bullet points with tips
  const tips = [
    'Consider reviewing your largest expenses to identify potential savings',
    'Look for patterns in your high-value transactions to help with future budgeting',
    'Set spending limits for categories where you tend to have higher expenses',
    'Try to plan large purchases in advance to avoid impulsive spending'
  ];
  
  tips.forEach((tip, index) => {
    const y = currentY + 30 + (index * 10);
    
    // Add bullet point
    doc.setFillColor(76, 175, 80);
    doc.circle(20, y - 2, 1.5, 'F');
    
    // Add tip text with word wrapping
    doc.text(tip, 25, y, { maxWidth: 165 });
  });
}

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
