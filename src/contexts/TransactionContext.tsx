import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Transaction {
  date: string;
  description: string;
  reference: string;
  merchant: string;
  amount: number;
}

interface CategoryData {
  name: string;
  count: number;
  amount: number;
  color: string;
  icon: string;
  transactions: Transaction[];
}

interface TransactionData {
  account: string;
  walletId: string;
  period: {
    from: string;
    to: string;
  };
  categories: CategoryData[];
}

interface TransactionContextType {
  transactionData: TransactionData | null;
  setTransactionData: (data: TransactionData | null) => void;
  isDataLoaded: boolean;
  setIsDataLoaded: (loaded: boolean) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactionData, setTransactionDataState] = useState<TransactionData | null>(null);
  const [isDataLoaded, setIsDataLoadedState] = useState(false);

  // Load data from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('transactionData');
    const savedIsLoaded = sessionStorage.getItem('isDataLoaded');
    
    if (savedData && savedData !== 'undefined' && savedData !== 'null') {
      try {
        setTransactionDataState(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing saved transaction data:', error);
        // Clear corrupted data
        sessionStorage.removeItem('transactionData');
      }
    }
    
    if (savedIsLoaded === 'true') {
      setIsDataLoadedState(true);
    }
  }, []);

  const setTransactionData = (data: TransactionData | null) => {
    setTransactionDataState(data);
    if (data) {
      sessionStorage.setItem('transactionData', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('transactionData');
    }
  };

  const setIsDataLoaded = (loaded: boolean) => {
    setIsDataLoadedState(loaded);
    sessionStorage.setItem('isDataLoaded', loaded.toString());
  };

  return (
    <TransactionContext.Provider value={{
      transactionData,
      setTransactionData,
      isDataLoaded,
      setIsDataLoaded
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};
