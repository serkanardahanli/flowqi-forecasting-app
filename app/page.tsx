import { redirect } from 'next/navigation';

export default function Home() {
  // Direct doorsturen naar login pagina
  redirect('/auth/signin');
} 