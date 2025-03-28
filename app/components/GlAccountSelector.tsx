'use client';

import { useEffect, useState } from 'react';
import { GlAccount } from '@/types/models';

export interface GlAccountSelectorProps {
  glAccounts: GlAccount[];
  onSelect: (accountId: string) => void;
  allowedLevels?: number[];
  initialSelectedCode?: string | null;
  className?: string;
}

export default function GlAccountSelector({
  glAccounts,
  onSelect,
  allowedLevels = [1, 2, 3],
  initialSelectedCode = null,
  className = '',
}: GlAccountSelectorProps) {
  const [selectedLevel1Code, setSelectedLevel1Code] = useState<string | null>(null);
  const [selectedLevel2Code, setSelectedLevel2Code] = useState<string | null>(null);
  const [selectedLevel3Code, setSelectedLevel3Code] = useState<string | null>(null);
  const [selectedGlAccountId, setSelectedGlAccountId] = useState<string | null>(null);

  // Filter accounts by level
  const level1Accounts = glAccounts.filter(
    (account) => account.level === 1 && allowedLevels.includes(1)
  );
  
  const level2Accounts = glAccounts.filter(
    (account) => 
      account.level === 2 && 
      allowedLevels.includes(2) && 
      (!selectedLevel1Code || account.parent_code === selectedLevel1Code)
  );
  
  const level3Accounts = glAccounts.filter(
    (account) => 
      account.level === 3 && 
      allowedLevels.includes(3) && 
      (!selectedLevel2Code || account.parent_code === selectedLevel2Code)
  );

  // Initialize the component with a selected account if provided
  useEffect(() => {
    if (initialSelectedCode && glAccounts.length > 0) {
      const account = glAccounts.find((a) => a.code === initialSelectedCode);
      if (account) {
        setSelectedGlAccountId(account.id);
        
        if (account.level === 3 && account.parent_code) {
          // For level 3, set both parent (level 2) and grandparent (level 1)
          setSelectedLevel3Code(account.code);
          setSelectedLevel2Code(account.parent_code);
          
          const parentAccount = glAccounts.find((a) => a.code === account.parent_code);
          if (parentAccount && parentAccount.parent_code) {
            setSelectedLevel1Code(parentAccount.parent_code);
          }
        } else if (account.level === 2 && account.parent_code) {
          // For level 2, set just the parent (level 1)
          setSelectedLevel2Code(account.code);
          setSelectedLevel1Code(account.parent_code);
        } else if (account.level === 1) {
          // For level 1, just set level 1
          setSelectedLevel1Code(account.code);
        }
      }
    }
  }, [initialSelectedCode, glAccounts]);

  // Update selected account whenever any selection changes
  useEffect(() => {
    let selectedAccount: GlAccount | undefined;
    
    if (selectedLevel3Code) {
      selectedAccount = glAccounts.find((a) => a.code === selectedLevel3Code);
    } else if (selectedLevel2Code) {
      selectedAccount = glAccounts.find((a) => a.code === selectedLevel2Code);
    } else if (selectedLevel1Code) {
      selectedAccount = glAccounts.find((a) => a.code === selectedLevel1Code);
    }
    
    if (selectedAccount) {
      setSelectedGlAccountId(selectedAccount.id);
      onSelect(selectedAccount.id);
    } else {
      setSelectedGlAccountId(null);
    }
  }, [selectedLevel1Code, selectedLevel2Code, selectedLevel3Code, glAccounts, onSelect]);

  // Handlers for dropdown changes
  const handleLevel1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value || null;
    setSelectedLevel1Code(newValue);
    setSelectedLevel2Code(null);
    setSelectedLevel3Code(null);
  };

  const handleLevel2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value || null;
    setSelectedLevel2Code(newValue);
    setSelectedLevel3Code(null);
  };

  const handleLevel3Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value || null;
    setSelectedLevel3Code(newValue);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {allowedLevels.includes(1) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hoofdgroep
          </label>
          <select
            value={selectedLevel1Code || ''}
            onChange={handleLevel1Change}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Selecteer een hoofdgroep</option>
            {level1Accounts.map((account) => (
              <option key={account.id} value={account.code}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {allowedLevels.includes(2) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subgroep
          </label>
          <select
            value={selectedLevel2Code || ''}
            onChange={handleLevel2Change}
            disabled={!selectedLevel1Code}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Selecteer een subgroep</option>
            {level2Accounts.map((account) => (
              <option key={account.id} value={account.code}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {allowedLevels.includes(3) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kostenpost
          </label>
          <select
            value={selectedLevel3Code || ''}
            onChange={handleLevel3Change}
            disabled={!selectedLevel2Code}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Selecteer een kostenpost</option>
            {level3Accounts.map((account) => (
              <option key={account.id} value={account.code}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
} 