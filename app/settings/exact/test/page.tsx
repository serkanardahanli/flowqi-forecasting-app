'use client';

import { ExactLoginButton } from '../login-button';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ExactTest() {
  return (
    <div>
      <h1>Test Exact Online Integratie</h1>
      <ExactLoginButton />
    </div>
  );
} 