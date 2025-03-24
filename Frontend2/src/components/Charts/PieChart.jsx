import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ transactions }) => {
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

  // Group transactions by category and calculate total
  const categoryTotals = transactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {});

  // Define colors for each category
  const categoryColors = {
    'Food': '#4CAF50',
    'Transport': '#2196F3',
    'Shopping': '#FF9800',
    'Bills': '#E91E63',
    'Investment': '#9C27B0',
    'Other': '#607D8B'
  };

  // Prepare data for the chart
  const labels = Object.keys(categoryTotals);
  const data = {
    labels: labels,
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: labels.map(category => categoryColors[category] || '#607D8B'),
      borderColor: labels.map(category => {
        const baseColor = categoryColors[category] || '#607D8B';
        // Darken the color for border
        return baseColor;
      }),
      borderWidth: 1,
      hoverOffset: 15
    }]
  };

  // Format for currency in tooltip
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate total amount
  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12
          },
          color: theme === 'dark' ? '#e0e0e0' : '#333'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = ((value / totalAmount) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        },
        backgroundColor: theme === 'dark' ? '#424242' : 'rgba(255, 255, 255, 0.9)',
        titleColor: theme === 'dark' ? '#e0e0e0' : '#333',
        bodyColor: theme === 'dark' ? '#e0e0e0' : '#333',
        borderColor: theme === 'dark' ? '#555' : '#ddd',
        borderWidth: 1
      },
      title: {
        display: true,
        text: 'Expenses by Category',
        font: {
          size: 16
        },
        color: theme === 'dark' ? '#e0e0e0' : '#333'
      }
    }
  };

  return (
    <div className="pie-chart-container">
      <Pie data={data} options={options} />
    </div>
  );
};

export default PieChart;