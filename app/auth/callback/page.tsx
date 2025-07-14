'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        console.log('User authenticated:', data.session.user);
        router.push('/');
      } else {
        router.push('/login');
        console.error('Authentication failed:', error);
      }
    };

    checkSession();
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#EAEBD0] text-[#AF3E3E]">
      <p className="text-lg font-medium">Logging you in...</p>
    </main>
  );
}
