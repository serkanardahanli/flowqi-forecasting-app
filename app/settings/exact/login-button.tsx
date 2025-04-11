'use client';

import { Button } from '@/app/components/ui/button';

export function ExactLoginButton() {
  const startExactAuth = () => {
    const clientId = '4b311ef8-c54e-479d-8dc0-855d2627c462';
    // Use the exact ngrok URL as configured in Exact Online
    const redirectUri = encodeURIComponent('https://broadly-happy-escargot.ngrok-free.app/api/exact/callback');
    const authUrl = `https://start.exactonline.nl/api/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&force_login=1`;
    
    console.log('Redirecting to Exact auth URL:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <Button onClick={startExactAuth} className="bg-blue-500 text-black">
      Log in bij Exact Online
    </Button>
  );
} 