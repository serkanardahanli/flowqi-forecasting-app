'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';

export default function UserMenu() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { user } = session;
      setUserEmail(user.email);

      // Try to get full name from user metadata first
      if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } 
      
      // Try to get name from user metadata
      else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name);
      } 
      
      // Fallback to email
      else {
        setUserName(user.email?.split('@')[0] || 'Gebruiker');
      }

      // Get avatar URL if available
      if (user.user_metadata?.avatar_url) {
        setUserAvatar(user.user_metadata.avatar_url);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleMenu}
        className="flex items-center text-gray-300 hover:text-white focus:outline-none"
      >
        <span className="sr-only">Open user menu</span>
        {userAvatar ? (
          <img
            className="h-8 w-8 rounded-full"
            src={userAvatar}
            alt="User avatar"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {userName ? userName.substring(0, 1).toUpperCase() : 'U'}
            </span>
          </div>
        )}
        <span className="ml-3 hidden md:block text-sm font-medium">{userName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-sm text-gray-500 truncate">{userEmail}</p>
          </div>
          <hr />
          <button
            onClick={handleSignOut}
            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Uitloggen
          </button>
        </div>
      )}
    </div>
  );
} 