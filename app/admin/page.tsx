'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FiCheck, FiX, FiUsers, FiShield, FiCalendar, FiActivity, FiRefreshCw, FiEye, FiCheckCircle } from 'react-icons/fi';
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
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
              {data.map((u) => {
                const businessCount = u._count?.ownedClubs || 0;
                const reviewCount = 0; // Placeholder
                const reportCount = 0; // Placeholder

                return (
                  <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col text-gray-800">
                    <div className="p-6">
                      {/* Header with Avatar & Basic Info */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-white shadow-sm">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#2c3e50] text-white font-bold text-lg">
                              {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg truncate">{u.name}</h3>
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                          </div>
                          <p className="text-gray-400 text-xs truncate">{u.phone || u.email}</p>
                        </div>
                      </div>

                      {/* Role & Status Row */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</p>
                          <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            u.role === 'club' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            {u.role === 'club' ? 'Business Owner' : u.role === 'user' ? 'Customer' : u.role}
                            {u.role === 'admin' && <FiShield size={10} />}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</p>
                          <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center ${u.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                            {u.isActive ? 'Active' : 'Suspended'}
                          </div>
                        </div>
                      </div>

                      {/* Dates Row */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Joined</p>
                          <p className="text-sm font-semibold">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Login</p>
                          <p className="text-sm font-semibold">{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}</p>
                        </div>
                      </div>

                      {/* Stats Icons */}
                      <div className="flex gap-4 p-3 bg-gray-50/50 rounded-xl mb-6">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <FiActivity size={12} className="text-gray-400" />
                          <span className="text-xs font-medium">{reviewCount} Reviews</span>
                        </div>
                        {u.role === 'club' && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <FiCalendar size={12} className="text-gray-400" />
                            <span className="text-xs font-medium">{businessCount} Businesses</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <FiCheckCircle size={12} className="text-gray-400" />
                          <span className="text-xs font-medium">{reportCount} Reports</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-3 gap-3">
                        <Link href={`/profile/${u.id}`} className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-[11px] font-bold">
                          <FiEye size={14} /> View
                        </Link>

                        {!u.isVerified ? (
                          <button
                            onClick={() => handleUserAction(u.id, 'approve')}
                            className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition text-[11px] font-bold"
                          >
                            <FiCheck size={14} /> Verify
                          </button>
                        ) : (
                          <button
                            className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition text-[11px] font-bold opacity-50 cursor-not-allowed"
                            disabled
                          >
                            <FiCheckCircle size={14} /> Verified
                          </button>
                        )}

                        {u.isActive ? (
                          u.role !== 'admin' ? (
                            <button
                              onClick={() => handleUserAction(u.id, 'suspend')}
                              className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-[11px] font-bold"
                            >
                              <FiActivity size={14} /> Deactivate
                            </button>
                          ) : (
                            <button className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-gray-50 text-gray-400 transition text-[11px] font-bold cursor-not-allowed" disabled>
                              <FiShield size={14} /> Root
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleUserAction(u.id, 'unsuspend')}
                            className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition text-[11px] font-bold"
                          >
                            <FiRefreshCw size={14} /> Recover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'clubs' && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
              {data.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col text-gray-800">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        {c.logo ? <img src={c.logo} className="w-full h-full object-contain p-1" /> : <FiCalendar className="text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{c.name}</h3>
                        <p className="text-gray-400 text-xs truncate">{c.address}, {c.county}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Owner</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {c.owner?.name?.[0]}
                        </div>
                        <span className="text-sm font-medium">{c.owner?.name}</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Verification</p>
                      <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center inline-block ${c.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {c.isVerified ? 'Verified' : 'Pending Review'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      {!c.isVerified ? (
                        <>
                          <button onClick={() => handleClubAction(c.id, 'approve')} className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition text-[11px] font-bold">
                            <FiCheck size={14} /> Approve
                          </button>
                          <button onClick={() => handleClubAction(c.id, 'reject')} className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-[11px] font-bold">
                            <FiX size={14} /> Reject
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleClubAction(c.id, 'reject')} className="col-span-2 flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-[11px] font-bold">
                          <FiX size={14} /> Revoke Verification
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
              {data.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col text-gray-800">
                  {e.image && (
                    <div className="h-32 w-full relative">
                      <img src={e.image} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/50">
                        {e.eventType || 'Regular'}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-1 truncate">{e.title}</h3>
                    <p className="text-gray-400 text-xs mb-4 flex items-center gap-1">
                      <FiCalendar size={12} /> {new Date(e.date).toLocaleDateString()}
                    </p>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-6">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">At</span>
                      <span className="text-xs font-semibold">{e.club?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <Link href={`/events/${e.id}`} className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-[11px] font-bold">
                        <FiEye size={14} /> Preview
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(e.id)}
                        className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-[11px] font-bold"
                      >
                        <FiActivity size={14} /> Remove
                      </button>
                    </div>
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
