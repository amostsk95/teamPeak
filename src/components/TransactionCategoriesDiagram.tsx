import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, CheckCircle } from 'lucide-react';
import { useTransaction } from '@/contexts/TransactionContext';
import { useAuth } from '@/contexts/AuthContext';

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

const TransactionCategoriesDiagram: React.FC = () => {
  const navigate = useNavigate();
  const { transactionData, setTransactionData, isDataLoaded, setIsDataLoaded } = useTransaction();
  const { username } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadedTransactionCount, setLoadedTransactionCount] = useState(0);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`https://hrmael4hnk.execute-api.ap-southeast-5.amazonaws.com/PEAK-DEV/?user_id=amos_tsk&data_date=21-SEP-2025`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load data');
      }

      const apiData = await response.json();
      console.log('Raw API data:', apiData);
      
      // Extract transactions from the API response structure
      let allTransactions: Transaction[] = [];
      
      if (Array.isArray(apiData) && apiData.length > 0 && apiData[0].data && apiData[0].data.transactions) {
        const transactions = apiData[0].data.transactions;
        allTransactions = transactions.map((item: any) => ({
          date: item.date || new Date().toLocaleDateString(),
          description: item.transaction_type || item.details || '',
          reference: item.reference || '',
          merchant: extractMerchant(item.details || item.transaction_type || ''),
          amount: parseFloat(item.amount?.replace('RM', '') || '0')
        }));
      }

      console.log('Transformed transactions:', allTransactions);

      // Categorize transactions
      const categoryGroups: { [key: string]: Transaction[] } = {
        'Transfer': [],
        'Fuel & Gas': [],
        'Transportation': [],
        'Top Up': [],
        'Food & Dining': [],
        'Others': []
      };

      allTransactions.forEach((transaction: Transaction) => {
        const desc = transaction.description.toLowerCase();
        const details = transaction.merchant.toLowerCase();
        
        if (desc.includes('transfer') || desc.includes('duitnow') || desc.includes('receive')) {
          categoryGroups['Transfer'].push(transaction);
        } else if (desc.includes('setel') || details.includes('setel') || desc.includes('fuel') || desc.includes('petrol')) {
          categoryGroups['Fuel & Gas'].push(transaction);
        } else if (desc.includes('paydirect') || details.includes('toll') || details.includes('suke') || details.includes('pantai') || details.includes('damansara') || details.includes('penchala')) {
          categoryGroups['Transportation'].push(transaction);
        } else if (desc.includes('reload') || details.includes('reload') || desc.includes('top up') || details.includes('card reload')) {
          categoryGroups['Top Up'].push(transaction);
        } else if (details.includes('mcdonald') || details.includes('restaurant') || details.includes('food') || details.includes('nasi lemak')) {
          categoryGroups['Food & Dining'].push(transaction);
        } else {
          categoryGroups['Others'].push(transaction);
        }
      });

      // Update categories with actual data
      setTransactionData(prev => {
        if (!prev) return prev;
        
        const updatedCategories = prev.categories.map(cat => {
          const categoryTransactions = categoryGroups[cat.name] || [];
          return {
            ...cat,
            transactions: categoryTransactions,
            count: categoryTransactions.length,
            amount: categoryTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
          };
        });

        return { ...prev, categories: updatedCategories };
      });
      
      setIsDataLoaded(true);
      setLoadedTransactionCount(allTransactions.length);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Error loading transaction data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingData(false);
    }
  };

  const extractMerchant = (details: string): string => {
    if (!details) return 'Unknown';
    
    // Remove common prefixes and suffixes
    let merchant = details
      .replace(/^\d+\s+/, '') // Remove leading numbers
      .replace(/\s+\d{4}\/\d{2}\/\d{4}.*$/i, '') // Remove date and time patterns
      .replace(/\s+\d{2}\/\d{2}\/\d{4}.*$/i, '') // Remove date patterns
      .replace(/\s+RM\d+\.\d{2}.*$/i, '') // Remove amount patterns
      .replace(/\s+\d{20,}.*$/i, '') // Remove long reference numbers
      .replace(/Fund Transfer\s+/i, '') // Remove "Fund Transfer"
      .replace(/Card Reload\s+/i, '') // Remove "Card Reload"
      .replace(/Payment\s+/i, '') // Remove "Payment"
      .replace(/Refund\s+/i, '') // Remove "Refund"
      .replace(/DUITNOW_RECEIVEFROM\s+/i, '') // Remove DuitNow prefix
      .replace(/Together\s+/i, '') // Remove "Together"
      .replace(/\s+\(\w+\s+\w+\).*$/i, '') // Remove parenthetical content
      .trim();
    
    // If still too long, take first few meaningful words
    const words = merchant.split(' ').filter(word => word.length > 2);
    if (words.length > 3) {
      merchant = words.slice(0, 3).join(' ');
    }
    
    return merchant || 'Unknown';
  };

  const handleCategorySelect = (category: CategoryData) => {
    navigate(`/transactions/${encodeURIComponent(category.name)}`);
  };

  useEffect(() => {
    console.log('Dashboard useEffect - transactionData:', transactionData);
    console.log('Dashboard useEffect - isDataLoaded:', isDataLoaded);
    
    // Always initialize if transactionData is undefined, regardless of isDataLoaded
    if (!transactionData) {
      console.log('Initializing empty categories - transactionData is undefined');
      const emptyCategories: CategoryData[] = [
        { name: 'Transfer', count: 0, amount: 0, color: '#FF6B6B', icon: '💸', transactions: [] },
        { name: 'Fuel & Gas', count: 0, amount: 0, color: '#4ECDC4', icon: '⛽', transactions: [] },
        { name: 'Transportation', count: 0, amount: 0, color: '#DDA0DD', icon: '🚗', transactions: [] },
        { name: 'Top Up', count: 0, amount: 0, color: '#FFEAA7', icon: '⬆️', transactions: [] },
        { name: 'Food & Dining', count: 0, amount: 0, color: '#96CEB4', icon: '🍽️', transactions: [] },
        { name: 'Others', count: 0, amount: 0, color: '#45B7D1', icon: '📦', transactions: [] }
      ];

      setTransactionData({
        account: 'TAN SOON KIT AMOS',
        walletId: '1000000818058552',
        period: {
          from: '2025-06-23',
          to: '2025-09-20'
        },
        categories: emptyCategories
      });
    } else {
      console.log('Using existing data from context');
    }
    setLoading(false);
  }, [transactionData, setTransactionData, isDataLoaded]);

  console.log('Render - loading:', loading);
  console.log('Render - transactionData:', transactionData);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading transaction data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!transactionData || !transactionData.categories) {
    console.log('Error state - transactionData:', transactionData);
    return (
      <div className="w-full max-w-6xl mx-auto p-6 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center text-red-600">
            <p>Error loading transaction data</p>
            <p className="text-sm mt-2">Check console for details</p>
          </div>
        </Card>
      </div>
    );
  }

  const { categories, account, period } = transactionData;
  const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <CardTitle className="text-2xl font-bold">
                Welcome {username || 'User'}
              </CardTitle>
              <p className="text-muted-foreground">
                Period: {period.from} to {period.to}
              </p>
              <p className="text-sm text-blue-600">
                Click on any category to view detailed transactions
              </p>
            </div>
            <Button 
              onClick={loadAllData}
              disabled={loadingData}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {loadingData ? 'Loading Data...' : 'Load Data'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {categories.map((category, index) => {
              const percentage = totalAmount > 0 ? ((category.amount / totalAmount) * 100).toFixed(1) : '0.0';
              
              return (
                <Card 
                  key={index} 
                  className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCategorySelect(category)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">{category.count} transactions</p>
                      <p className="font-bold text-lg">RM {category.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{percentage}% of total</p>
                    </div>
                    <div 
                      className="absolute bottom-0 left-0 h-1 transition-all duration-300"
                      style={{ 
                        backgroundColor: category.color,
                        width: `${percentage}%`
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Data Loaded Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-600">
              Successfully loaded <span className="font-bold text-green-600">{loadedTransactionCount}</span> transactions from the API.
            </p>
          </div>
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionCategoriesDiagram;
