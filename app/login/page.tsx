'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/');
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#EAEBD0] text-[#AF3E3E]">
      <h1 className="text-3xl font-bold mb-4">Welcome to Zaplog ⚡️</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-[#DA6C6C] hover:bg-[#CD5656] text-white font-semibold py-2 px-6 rounded"
      >
        Continue with Google
      </button>
    </main>
  );
}
