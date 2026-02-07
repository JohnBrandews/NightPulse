'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Fetch current user and redirect to their profile
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          router.push(`/profile/${data.user.id}`);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    </Layout>
  );
}
