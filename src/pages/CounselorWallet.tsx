
import React, { useState } from 'react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Bell } from 'lucide-react';

const CounselorWallet: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fill-bank');

  return (
    <CounselorSidebarLayout activePath="/counselor-wallet">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Welcome Musa! 👋</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
            <Search size={16} className="mr-2" />
            Search
          </Button>
          <Button size="icon" variant="ghost">
            <Bell size={18} />
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('fill-bank')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'fill-bank' 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Fill Bank Details
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'withdraw' 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Withdraw Funds
          </button>
        </div>
        
        <div className="p-8">
          {activeTab === 'fill-bank' && (
            <div className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email Address:</label>
                <Input placeholder="Enter your email address" className="h-12" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Account Number</label>
                <Input placeholder="Enter Account Number" className="h-12" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Bank Name</label>
                <Select>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Bank Name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gtb">GTBank</SelectItem>
                    <SelectItem value="first">First Bank</SelectItem>
                    <SelectItem value="uba">UBA</SelectItem>
                    <SelectItem value="zenith">Zenith Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Verify BVN</label>
                <Input placeholder="Enter BVN" className="h-12" />
              </div>
              
              <Button className="bg-teal-600 hover:bg-teal-700 px-8">
                Submit Details
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                For any inquiries, please contact us at<br />
                support@quluub.com
              </p>
            </div>
          )}
          
          {activeTab === 'withdraw' && (
            <div className="space-y-6 max-w-md">
              <div className="text-right mb-6">
                <div className="text-sm text-gray-600">Total Available Balance:</div>
                <div className="text-xl font-bold">#800,840.00</div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email Address:</label>
                <Input placeholder="Enter your email address" className="h-12" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Amount to Withdraw</label>
                <Input placeholder="Enter Amount" className="h-12" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Payment Method</label>
                <Select>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="bg-teal-600 hover:bg-teal-700 px-8">
                Submit Withdrawal
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                For any inquiries, please contact us at<br />
                support@quluub.com
              </p>
            </div>
          )}
        </div>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorWallet;
