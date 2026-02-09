'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FiCheck, FiX, FiUsers, FiShield, FiCalendar, FiActivity, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'clubs' | 'events'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchData();
    }
  }, [activeTab, currentUser]);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.role !== 'admin') {
        window.location.href = '/';
      } else {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/admin/users';
      else if (activeTab === 'clubs') endpoint = '/api/admin/clubs';
      else if (activeTab === 'events') endpoint = '/api/admin/events';

      const res = await fetch(endpoint);
      const json = await res.json();

      if (activeTab === 'users') setData(json.users || []);
      else if (activeTab === 'clubs') setData(json.clubs || []);
      else if (activeTab === 'events') setData(json.events || []);

    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        toast.success(`User ${action} successful`);
        fetchData();
      } else {
        toast.error('Action failed');
      }
    } catch (error) {
      toast.error('Error performing action');
    }
  };

  const handleClubAction = async (clubId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/clubs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, action }),
      });
      if (res.ok) {
        toast.success(`Club ${action} successful`);
        fetchData();
      } else {
        toast.error('Action failed');
      }
    } catch (error) {
      toast.error('Error performing action');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to remove this event?')) return;
    try {
      const res = await fetch(`/api/admin/events?id=${eventId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Event removed');
        fetchData();
      } else {
        toast.error('Failed to remove event');
      }
    } catch (error) {
      toast.error('Error deleting event');
    }
  };

  if (!currentUser) return <div className="p-8 text-center text-gray-400">Loading Admin...</div>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              <FiShield className="w-8 h-8 mr-3 text-accent-primary" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400">Manage platform entities and content</p>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center">
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-gray-400'}`}
          >
            Users & Approvals
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-4 py-2 font-medium ${activeTab === 'clubs' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-gray-400'}`}
          >
            Clubs
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-medium ${activeTab === 'events' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-gray-400'}`}
          >
            Events
          </button>
        </div>

        {/* Content */}
        <div className="card overflow-x-auto">
          {activeTab === 'users' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3">Name/Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3">
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3">
                      {u.isVerified && <span className="text-green-400 mr-2">✓ Verified</span>}
                      {!u.isActive && <span className="text-red-400">⚠ Suspended</span>}
                      {!u.isVerified && u.isActive && <span className="text-yellow-400">Pending</span>}
                    </td>
                    <td className="p-3 flex space-x-2">
                      {!u.isVerified && (
                        <>
                          <button onClick={() => handleUserAction(u.id, 'approve')} className="btn-primary text-xs px-2 py-1">Approve</button>
                          <button onClick={() => handleUserAction(u.id, 'reject')} className="btn-secondary text-xs px-2 py-1">Reject</button>
                        </>
                      )}

                      {u.isActive ? (
                        u.role !== 'admin' ? (
                          <button onClick={() => handleUserAction(u.id, 'suspend')} className="text-red-400 hover:underline text-sm">Suspend</button>
                        ) : (
                          <span className="text-gray-500 text-sm">Admin</span>
                        )
                      ) : (
                        <button onClick={() => handleUserAction(u.id, 'unsuspend')} className="text-green-400 hover:underline text-sm">Unsuspend</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'clubs' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3">Club Name</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 font-semibold">{c.name}</td>
                    <td className="p-3">
                      <div className="text-sm">{c.owner?.name}</div>
                      <div className="text-xs text-gray-500">{c.owner?.email}</div>
                    </td>
                    <td className="p-3">
                      {c.isVerified ? <span className="text-green-400">Verified</span> : <span className="text-yellow-400">Pending</span>}
                    </td>
                    <td className="p-3 flex space-x-2">
                      {!c.isVerified && (
                        <>
                          <button onClick={() => handleClubAction(c.id, 'approve')} className="btn-primary text-xs px-2 py-1">Approve</button>
                          <button onClick={() => handleClubAction(c.id, 'reject')} className="btn-secondary text-xs px-2 py-1">Reject</button>
                        </>
                      )}
                      {c.isVerified && (
                        <button onClick={() => handleClubAction(c.id, 'reject')} className="text-red-400 hover:underline text-sm">Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'events' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3">Event</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Club</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3">
                      <div className="font-semibold">{e.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{e.description}</div>
                    </td>
                    <td className="p-3 text-sm">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-3 text-sm">{e.club?.name}</td>
                    <td className="p-3">
                      <button onClick={() => handleDeleteEvent(e.id)} className="text-red-500 hover:text-red-400 border border-red-500 px-2 py-1 rounded text-xs">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
