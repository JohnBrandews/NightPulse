'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FiCheck, FiX, FiUsers, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
    loadPendingVerifications();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      // This would fetch pending verifications from the API
      // For now, placeholder
      setPendingVerifications([]);
    } catch (error) {
      console.error('Failed to load verifications:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">Access denied</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <FiShield className="w-8 h-8 mr-3" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage verifications, clubs, and users</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Verifications</p>
                <p className="text-3xl font-bold mt-2">{pendingVerifications.length}</p>
              </div>
              <FiUsers className="w-12 h-12 text-accent-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pending Verifications</h2>
          {pendingVerifications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending verifications</p>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((item) => (
                <div key={item._id} className="border-b border-night-lighter pb-4">
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex space-x-2 mt-2">
                    <button className="btn-primary text-sm">
                      <FiCheck className="w-4 h-4 mr-1" />
                      Approve
                    </button>
                    <button className="btn-secondary text-sm">
                      <FiX className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
