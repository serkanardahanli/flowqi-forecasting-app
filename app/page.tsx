import { redirect } from 'next/navigation';

export default function Home() {
  // Direct doorsturen naar dashboard zonder auth check
  redirect('/dashboard');
} 