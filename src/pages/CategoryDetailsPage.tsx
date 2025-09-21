import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, ChevronLeft, ChevronRight, Upload, Send, X, CheckCircle } from 'lucide-react';
import { useTransaction } from '@/contexts/TransactionContext';

interface Transaction {
  date: string;
  description: string;
  reference: string;
  merchant: string;
  amount: number;
}

const CategoryDetailsPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { transactionData, setTransactionData, isDataLoaded, setIsDataLoaded } = useTransaction();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [loadedTransactionCount, setLoadedTransactionCount] = useState(0);
  const transactionsPerPage = 10;

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((_, index) => index));
    }
  };

  const handleSelectTransaction = (index: number) => {
    setSelectedTransactions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  useEffect(() => {
    // If data is already loaded, filter transactions for this category
    if (isDataLoaded && transactionData && categoryName) {
      const category = transactionData.categories.find(cat => cat.name === categoryName);
      if (category) {
        setTransactions(category.transactions);
      }
    }
  }, [isDataLoaded, transactionData, categoryName]);

  const loadTransactions = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`https://hrmael4hnk.execute-api.ap-southeast-5.amazonaws.com/PEAK-DEV/?user_id=amos_tsk&data_date=21-SEP-2025`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      const apiData = await response.json();
      console.log('API Response:', apiData);
      
      let allTransactions: Transaction[] = [];
      
      // Handle the correct API response structure
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

      // Filter transactions by category
      if (categoryName && allTransactions.length > 0) {
        const filteredTransactions = allTransactions.filter((transaction: Transaction) => {
          const desc = transaction.description.toLowerCase();
          const details = transaction.merchant.toLowerCase();
          
          switch (categoryName) {
            case 'Transfer':
              return desc.includes('transfer') || desc.includes('duitnow') || desc.includes('receive');
            case 'Fuel & Gas':
              return desc.includes('setel') || details.includes('setel') || desc.includes('fuel') || desc.includes('petrol');
            case 'Transportation':
              return desc.includes('paydirect') || details.includes('toll') || details.includes('suke') || details.includes('pantai') || details.includes('damansara') || details.includes('penchala');
            case 'Top Up':
              return desc.includes('reload') || details.includes('reload') || desc.includes('top up') || details.includes('card reload');
            case 'Food & Dining':
              return details.includes('mcdonald') || details.includes('restaurant') || details.includes('food') || details.includes('nasi lemak');
            case 'Others':
              return !desc.includes('transfer') && !desc.includes('setel') && !desc.includes('paydirect') && !desc.includes('reload') && !details.includes('mcdonald') && !details.includes('restaurant');
            default:
              return true;
          }
        });
        setTransactions(filteredTransactions);
        
        // Update context with all categorized data
        if (transactionData) {
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

          const updatedCategories = transactionData.categories.map(cat => {
            const categoryTransactions = categoryGroups[cat.name] || [];
            return {
              ...cat,
              transactions: categoryTransactions,
              count: categoryTransactions.length,
              amount: categoryTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
            };
          });

          setTransactionData({ ...transactionData, categories: updatedCategories });
          setIsDataLoaded(true);
        }
      } else {
        setTransactions(allTransactions);
      }

      setLoadedTransactionCount(allTransactions.length);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const maskMerchant = (merchant: string): string => {
    const words = merchant.split(' ');
    if (words.length > 1) {
      const firstWord = words[0];
      const restLength = merchant.length - firstWord.length - 1; // -1 for space
      return `${firstWord} ${'*'.repeat(Math.max(restLength, 3))}`;
    }
    return merchant;
  };

  useEffect(() => {
    // If data is already loaded, filter transactions for this category
    if (isDataLoaded && transactionData && categoryName) {
      const category = transactionData.categories.find(cat => cat.name === categoryName);
      if (category) {
        setTransactions(category.transactions);
      }
    }
    setLoading(false);
  }, [isDataLoaded, transactionData, categoryName]);

  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );

  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">{loadingData ? 'Loading transactions...' : 'Initializing...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/transactions')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Categories
                </Button>
                <CardTitle className="text-xl">{categoryName} Transactions</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={loadTransactions}
                  disabled={loadingData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loadingData ? 'Loading Data...' : 'Load Data'}
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedTransactions([]);
                    setShowModal(true);
                  }}
                  disabled={transactions.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </Button>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{transactions.length} transactions</p>
                  <p className="font-bold text-lg">RM {totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-left p-3 font-semibold">Merchant</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                        <th className="text-right p-3 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((transaction, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{transaction.date}</td>
                          <td className="p-3">{maskMerchant(transaction.merchant)}</td>
                          <td className="p-3 text-sm">{transaction.description}</td>
                          <td className="p-3 text-right font-semibold">
                            RM {transaction.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, transactions.length)} of {transactions.length} transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions found for this category.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Confirm submit?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedTransactions.length}/{transactions.length})
                </span>
              </label>
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(index)}
                        onChange={() => handleSelectTransaction(index)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{maskMerchant(transaction.merchant)}</span>
                          <span className="font-bold text-lg">RM {transaction.amount.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{transaction.date}</p>
                        <p className="text-xs text-gray-500">{transaction.description}</p>
                        <p className="text-xs text-gray-400">Ref: {transaction.reference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions to display.</p>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {selectedTransactions.length} of {transactions.length} transactions selected
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const selectedData = selectedTransactions.map(i => transactions[i]);
                    const jsonOutput = {
                      category: categoryName,
                      total_transactions: selectedData.length,
                      total_amount: selectedData.reduce((sum, t) => sum + t.amount, 0),
                      transactions: selectedData
                    };
                    
                    console.log('JSON data being sent to API:', jsonOutput);
                    
                    try {
                      // POST API call (URL to be provided later)
                      const apiUrl = 'https://hrmael4hnk.execute-api.ap-southeast-5.amazonaws.com/PEAK-DEV/'; // Replace with actual API URL
                      const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(jsonOutput)
                      });

                      if (response.ok) {
                        console.log('API submission successful');
                        const apiResponseText = await response.text();
                        console.log('API response:', apiResponseText);
                        
                        // Store the raw response for display
                        setApiResponse(apiResponseText);
                        setShowResponseModal(true);
                        
                        setShowModal(false);
                        setSelectedTransactions([]);
                      } else {
                        console.error('API submission failed:', response.status);
                        alert(`API submission failed: ${response.status}. Please reselect transactions and try again.`);
                        // Keep modal open and selections intact for retry
                      }
                    } catch (error) {
                      console.error('API submission error:', error);
                      alert('Error submitting data to API. Please reselect transactions and try again.');
                      // Keep modal open and selections intact for retry
                    }
                  }}
                  disabled={selectedTransactions.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit ({selectedTransactions.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                Successfully loaded <span className="font-bold text-green-600">{loadedTransactionCount}</span> transactions for {categoryName}.
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

        {/* API Response Modal */}
        {showResponseModal && (
          <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center text-gray-800 text-lg">
                  <span className="mr-2">📋</span>
                  Submission Confirmation
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <p className="text-sm text-gray-600">
                  Please review the submission details below:
                </p>
                
                {(() => {
                  try {
                    const data = JSON.parse(apiResponse);
                    const message = data.message || data;
                    const acceptedDoc = message.acceptedDocuments && message.acceptedDocuments[0];
                    
                    return (
                      <div className="space-y-4">
                        {message.submissionUid && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                              Submission UID
                            </div>
                            <div className="text-sm font-mono text-gray-900 bg-white p-2 rounded border break-all">
                              {message.submissionUid}
                            </div>
                          </div>
                        )}
                        
                        {acceptedDoc && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                              Accepted Document
                            </div>
                            
                            {acceptedDoc.uuid && (
                              <div className="mb-3">
                                <div className="text-xs text-gray-500 mb-1">UUID</div>
                                <div className="text-sm font-mono text-gray-900 bg-white p-2 rounded border break-all">
                                  {acceptedDoc.uuid}
                                </div>
                              </div>
                            )}
                            
                            {acceptedDoc.invoiceCodeNumber && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Invoice Code Number</div>
                                <div className="text-sm font-mono text-gray-900 bg-white p-2 rounded border break-all">
                                  {acceptedDoc.invoiceCodeNumber}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  } catch {
                    return (
                      <div className="text-center py-8">
                        <div className="text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
                          <p>Processing response...</p>
                        </div>
                      </div>
                    );
                  }
                })()}
                
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button onClick={() => setShowResponseModal(false)} variant="outline" className="px-6">
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailsPage;
