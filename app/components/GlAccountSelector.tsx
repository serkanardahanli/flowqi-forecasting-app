'use client';

import { useEffect, useState } from 'react';
import { GlAccount } from '@/types/models';

export interface GlAccountSelectorProps {
  glAccounts: GlAccount[];
  onSelect: (accountId: string) => void;
  allowedLevels?: number[];
  initialSelectedCode?: string | null;
  className?: string;
  accountType?: 'Inkomsten' | 'Uitgaven';
}

export default function GlAccountSelector({
  glAccounts,
  onSelect,
  allowedLevels = [1, 2, 3],
  initialSelectedCode = null,
  className = '',
  accountType,
}: GlAccountSelectorProps) {
  const [selectedLevel1Code, setSelectedLevel1Code] = useState<string | null>(null);
  const [selectedLevel2Code, setSelectedLevel2Code] = useState<string | null>(null);
  const [selectedLevel3Code, setSelectedLevel3Code] = useState<string | null>(null);
  const [selectedGlAccountId, setSelectedGlAccountId] = useState<string | null>(null);

  // Filter accounts by level and type
  const level1Accounts = glAccounts.filter(
    (account) => 
      account.level === 1 && 
      allowedLevels.includes(1) &&
      (!accountType || account.type === accountType)
  );
  
  const level2Accounts = glAccounts.filter(
    (account) => 
      account.level === 2 && 
      allowedLevels.includes(2) && 
      (!selectedLevel1Code || account.parent_code === selectedLevel1Code) &&
      (!accountType || account.type === accountType)
  );
  
  const level3Accounts = glAccounts.filter(
    (account) => 
      account.level === 3 && 
      allowedLevels.includes(3) && 
      (!selectedLevel2Code || account.parent_code === selectedLevel2Code) &&
      (!accountType || account.type === accountType)
  );

  // Handle selection changes
  const handleLevel1Change = (code: string) => {
    setSelectedLevel1Code(code);
    setSelectedLevel2Code(null);
    setSelectedLevel3Code(null);
    setSelectedGlAccountId(null);
  };

  const handleLevel2Change = (code: string) => {
    setSelectedLevel2Code(code);
    setSelectedLevel3Code(null);
    setSelectedGlAccountId(null);
  };

  const handleLevel3Change = (code: string) => {
    setSelectedLevel3Code(code);
    const account = glAccounts.find(a => a.code === code);
    if (account) {
      setSelectedGlAccountId(account.id);
      onSelect(account.id);
    }
  };

  // Initialize with initial selected code if provided
  useEffect(() => {
    if (initialSelectedCode) {
      const account = glAccounts.find(a => a.code === initialSelectedCode);
      if (account) {
        setSelectedGlAccountId(account.id);
        setSelectedLevel3Code(account.code);
        if (account.parent_code) {
          setSelectedLevel2Code(account.parent_code);
          const parent2 = glAccounts.find(a => a.code === account.parent_code);
          if (parent2?.parent_code) {
            setSelectedLevel1Code(parent2.parent_code);
          }
        }
      }
    }
  }, [initialSelectedCode, glAccounts]);

  return (
    <div className={`flex gap-2 ${className}`}>
      {allowedLevels.includes(1) && (
        <select
          className="form-select rounded-md border-gray-300"
          value={selectedLevel1Code || ''}
          onChange={(e) => handleLevel1Change(e.target.value)}
        >
          <option value="">Selecteer hoofdgroep</option>
          {level1Accounts.map((account) => (
            <option key={account.code} value={account.code}>
              {account.code} - {account.name}
            </option>
          ))}
        </select>
      )}

      {allowedLevels.includes(2) && selectedLevel1Code && (
        <select
          className="form-select rounded-md border-gray-300"
          value={selectedLevel2Code || ''}
          onChange={(e) => handleLevel2Change(e.target.value)}
        >
          <option value="">Selecteer subgroep</option>
          {level2Accounts.map((account) => (
            <option key={account.code} value={account.code}>
              {account.code} - {account.name}
            </option>
          ))}
        </select>
      )}

      {allowedLevels.includes(3) && selectedLevel2Code && (
        <select
          className="form-select rounded-md border-gray-300"
          value={selectedLevel3Code || ''}
          onChange={(e) => handleLevel3Change(e.target.value)}
        >
          <option value="">Selecteer kostenpost</option>
          {level3Accounts.map((account) => (
            <option key={account.code} value={account.code}>
              {account.code} - {account.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
} 