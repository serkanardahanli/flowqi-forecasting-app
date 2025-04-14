'use client';

export function LoginButton() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_EXACT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_EXACT_REDIRECT_URI || '');
    
    console.log('Using redirect URI:', redirectUri);
    
    window.location.href = `https://start.exactonline.nl/api/oauth2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&state=random_state` +
      `&force_login=1`;
  };
  
  return (
    <button 
      onClick={handleLogin}
      style={{
        backgroundColor: '#0070f3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%'
      }}
    >
      Login met Exact Online
    </button>
  );
}

// Exporteer ook als ExactLoginButton voor backwards compatibility
export const ExactLoginButton = LoginButton; 