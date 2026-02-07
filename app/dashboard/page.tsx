'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FiUsers, FiCalendar, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          loadStats(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const loadStats = async (userData: any) => {
    try {
      if (userData.role === 'user') {
        const [bookingsRes, messagesRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/messages'),
        ]);
        const bookings = await bookingsRes.json();
        const messages = await messagesRes.json();
        setStats({
          bookings: bookings.bookings?.length || 0,
          messages: messages.conversations?.length || 0,
        });
      } else if (userData.role === 'club') {
        const bookingsRes = await fetch('/api/bookings');
        const bookings = await bookingsRes.json();
        setStats({
          bookings: bookings.bookings?.length || 0,
          pending: bookings.bookings?.filter((b: any) => b.status === 'pending').length || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-400">Here's what's happening on your dashboard</p>
        </div>

        {user.role === 'user' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Bookings</p>
                    <p className="text-3xl font-bold mt-2">{stats.bookings || 0}</p>
                  </div>
                  <FiCalendar className="w-12 h-12 text-accent-primary" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Conversations</p>
                    <p className="text-3xl font-bold mt-2">{stats.messages || 0}</p>
                  </div>
                  <FiMessageCircle className="w-12 h-12 text-neon-pink" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/discover" className="btn-primary w-full block text-center">
                    Discover People & Clubs
                  </Link>
                  <Link href="/messages" className="btn-secondary w-full block text-center">
                    View Messages
                  </Link>
                </div>
              </div>
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
                <p className="text-gray-400">No recent bookings</p>
              </div>
            </div>
          </>
        )}

        {user.role === 'club' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Bookings</p>
                    <p className="text-3xl font-bold mt-2">{stats.bookings || 0}</p>
                  </div>
                  <FiCalendar className="w-12 h-12 text-accent-primary" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-3xl font-bold mt-2">{stats.pending || 0}</p>
                  </div>
                  <FiTrendingUp className="w-12 h-12 text-neon-pink" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link href="/bookings" className="btn-primary w-full block text-center">
                    Manage Bookings
                  </Link>
                  <Link href="/clubs/create" className="btn-secondary w-full block text-center">
                    Create Club Profile
                  </Link>
                </div>
              </div>
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
                <p className="text-gray-400">No recent bookings</p>
              </div>
            </div>
          </>
        )}

        {user.role === 'promoter' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Promoter Dashboard</h2>
            <p className="text-gray-400">Promoter features coming soon...</p>
          </div>
        )}

        {user.role === 'dj' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">DJ Dashboard</h2>
            <p className="text-gray-400">DJ features coming soon...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
