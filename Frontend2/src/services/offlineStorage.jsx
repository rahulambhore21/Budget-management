import { addTransaction } from './transaction';
import { toast } from 'react-hot-toast';

// Constants
const OFFLINE_TRANSACTIONS_KEY = 'offline_transactions';

// Check if device is online
export const isOnline = () => {
  return navigator.onLine;
};

// Save a transaction to local storage when offline
export const saveOfflineTransaction = (transaction) => {
  try {
    // Get existing offline transactions
    const existingTransactions = JSON.parse(localStorage.getItem(OFFLINE_TRANSACTIONS_KEY) || '[]');
    
    // Add transaction with a temporary ID and timestamp
    const offlineTransaction = {
      ...transaction,
      tempId: Date.now().toString(),
      createdAt: new Date().toISOString(),
      synced: false
    };
    
    // Save to local storage
    localStorage.setItem(
      OFFLINE_TRANSACTIONS_KEY, 
      JSON.stringify([...existingTransactions, offlineTransaction])
    );
    
    return offlineTransaction;
  } catch (error) {
    console.error('Failed to save transaction offline:', error);
    throw new Error('Failed to save transaction offline');
  }
};

// Get all offline transactions
export const getOfflineTransactions = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_TRANSACTIONS_KEY) || '[]');
  } catch (error) {
    console.error('Failed to get offline transactions:', error);
    return [];
  }
};

// Sync offline transactions when back online
export const syncOfflineTransactions = async (onSuccess) => {
  const offlineTransactions = getOfflineTransactions();
  
  if (offlineTransactions.length === 0) {
    return { success: true, synced: 0 };
  }
  
  let syncedCount = 0;
  let failedTransactions = [];
  
  // Process each transaction
  for (const transaction of offlineTransactions) {
    try {
      // Submit to server
      await addTransaction(transaction);
      syncedCount++;
    } catch (error) {
      console.error('Failed to sync transaction:', error);
      failedTransactions.push({
        transaction,
        error: error.message || 'Unknown error'
      });
    }
  }
  
  // Clear successfully synced transactions
  if (syncedCount > 0) {
    localStorage.setItem(
      OFFLINE_TRANSACTIONS_KEY,
      JSON.stringify(failedTransactions.map(f => f.transaction))
    );
    
    // Call success callback if provided
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(syncedCount);
    }
    
    toast.success(`Successfully synced ${syncedCount} offline transaction(s)`);
  }
  
  return {
    success: failedTransactions.length === 0,
    synced: syncedCount,
    failed: failedTransactions.length,
    failedTransactions
  };
};

// Check for and sync transactions when coming back online
export const setupOfflineSyncListener = () => {
  window.addEventListener('online', async () => {
    toast.loading('Syncing offline transactions...');
    try {
      const result = await syncOfflineTransactions();
      if (result.failed > 0) {
        toast.error(`Failed to sync ${result.failed} transaction(s). They will be kept offline.`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync offline transactions');
    }
  });
};

// Clear all offline transactions (for testing)
export const clearOfflineTransactions = () => {
  localStorage.removeItem(OFFLINE_TRANSACTIONS_KEY);
};
