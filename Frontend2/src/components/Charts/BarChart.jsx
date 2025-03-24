import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = ({ transactions }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    
    window.addEventListener('storage', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);
  
  // If no transactions, show empty state
  if (!transactions || transactions.length === 0) {
    return <div className="no-data">No transaction data to display</div>;
  }

  // Group transactions by category
  const categoryTotals = transactions.reduce((acc, transaction) => {
    const { category, amount } = transaction;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});

  // Define colors for each category
  const categoryColors = {
    'Food': 'rgba(76, 175, 80, 0.7)',
    'Transport': 'rgba(33, 150, 243, 0.7)',
    'Shopping': 'rgba(255, 152, 0, 0.7)',
    'Bills': 'rgba(233, 30, 99, 0.7)',
    'Investment': 'rgba(156, 39, 176, 0.7)',
    'Other': 'rgba(96, 125, 139, 0.7)'
  };

  // Sort categories by amount (descending)
  const sortedCategories = Object.keys(categoryTotals)
    .sort((a, b) => categoryTotals[b] - categoryTotals[a]);

  const data = {
    labels: sortedCategories,
    datasets: [
      {
        label: 'Amount (₹)',
        data: sortedCategories.map(category => categoryTotals[category]),
        backgroundColor: sortedCategories.map(category => categoryColors[category] || 'rgba(96, 125, 139, 0.7)'),
        borderColor: sortedCategories.map(category => {
          const baseColor = categoryColors[category] || 'rgba(96, 125, 139, 0.7)';
          return baseColor.replace('0.7', '1');
        }),
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: sortedCategories.map(category => categoryColors[category]?.replace('0.7', '0.9') || 'rgba(96, 125, 139, 0.9)')
      },
    ],
  };

  // Format for currency in tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Expenses by Category',
        font: {
          size: 16
        },
        color: theme === 'dark' ? '#e0e0e0' : '#333'
      },
      tooltip: {
        callbacks: {
          label: (context) => formatCurrency(context.raw)
        },
        backgroundColor: theme === 'dark' ? '#424242' : 'rgba(255, 255, 255, 0.9)',
        titleColor: theme === 'dark' ? '#e0e0e0' : '#333',
        bodyColor: theme === 'dark' ? '#e0e0e0' : '#333',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        borderWidth: 1
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: (value) => formatCurrency(value),
          color: theme === 'dark' ? '#b0b0b0' : '#333'
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: theme === 'dark' ? '#b0b0b0' : '#333'
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        right: 25,
        bottom: 10,
        left: 10
      }
    }
  };

  return <Bar data={data} options={options} height={sortedCategories.length > 3 ? 300 : 200} />;
};

export default BarChart;
