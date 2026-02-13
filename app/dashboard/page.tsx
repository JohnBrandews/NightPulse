'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FiUsers, FiCalendar, FiMessageCircle, FiTrendingUp, FiMusic } from 'react-icons/fi';

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
      .catch(() => { });
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
          recentBookings: bookings.bookings?.slice(0, 5) || [], // Latest 5 bookings
        });
      } else if (userData.role === 'club') {
        const [bookingsRes, clubsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/clubs?owner=me')
        ]);
        const bookings = await bookingsRes.json();
        const clubsData = await clubsRes.json();

        setStats({
          bookings: bookings.bookings?.length || 0,
          pending: bookings.bookings?.filter((b: any) => b.status === 'pending').length || 0,
          clubs: clubsData.clubs || []
        });
      } else if (userData.role === 'dj' || userData.role === 'promoter') {
        const [appsRes, meRes] = await Promise.all([
          fetch('/api/applications'),
          fetch('/api/auth/me')
        ]);
        const appsData = await appsRes.json();
        const meData = await meRes.json();
        
        // Get music links for DJ (already parsed by /api/auth/me)
        let musicLinks: string[] = [];
        if (userData.role === 'dj' && meData.user?.djMusicLinks) {
          musicLinks = Array.isArray(meData.user.djMusicLinks) ? meData.user.djMusicLinks : [];
        }
        
        setStats({
          applications: appsData.applications || [],
          musicLinks: musicLinks
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

        {/* Global Profile Card for All Roles */}
        <div className="card mb-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 relative">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-accent-primary text-white">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <Link href="/dashboard/profile" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer text-white text-xs font-medium">
              Edit
            </Link>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              {user.isVerified && (
                <span className="bg-blue-500 text-white text-xs p-1 rounded-full" title="Verified">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <div className="text-gray-400 mt-1 space-y-1">
              <p className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-sm">{user.email}</span>
              </p>
              {user.phone && <p className="text-sm">{user.phone}</p>}
            </div>
          </div>

          <div>
            <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-bold capitalize">
              {user.role === 'user' ? 'Client' : user.role}
            </span>
          </div>
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
                {stats.recentBookings && stats.recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentBookings.map((booking: any) => (
                      <div key={booking.id} className="p-3 bg-gray-800 rounded flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{booking.club?.name || booking.event?.club?.name || 'Unknown Club'}</p>
                          <div className="text-xs text-gray-400">
                            {new Date(booking.date).toLocaleDateString()} at {booking.time}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs capitalize font-medium ${booking.status === 'confirmed' ? 'bg-green-900 text-green-300' :
                            booking.status === 'rejected' || booking.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                              'bg-yellow-900 text-yellow-300'
                          }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No recent bookings found.</p>
                )}
              </div>
            </div>
          </>
        )}

        {user.role === 'club' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <p className="text-gray-400 text-sm">Pending Requests</p>
                    <p className="text-3xl font-bold mt-2">{stats.pending || 0}</p>
                  </div>
                  <FiTrendingUp className="w-12 h-12 text-neon-pink" />
                </div>
              </div>
            </div>

            {/* Management Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/events/create" className="card hover:bg-gray-800 transition cursor-pointer group">
                <h3 className="text-xl font-bold text-accent-primary group-hover:text-white mb-2">Post Event</h3>
                <p className="text-gray-400 text-sm">Create a new event or gig for your club.</p>
              </Link>
              <Link href="/events/create" className="card hover:bg-gray-800 transition cursor-pointer group">
                <h3 className="text-xl font-bold text-accent-primary group-hover:text-white mb-2">Post Event</h3>
                <p className="text-gray-400 text-sm">Create a new event or gig for your club.</p>
              </Link>

              {/* Club Profiles List */}
              <div className="card">
                <h3 className="text-xl font-bold text-accent-primary mb-2">My Clubs</h3>
                {stats.clubs && stats.clubs.length > 0 ? (
                  <div className="space-y-2">
                    {stats.clubs.map((club: any) => (
                      <Link key={club.id} href={`/clubs/${club.id}/edit`} className="block p-2 bg-gray-800 rounded hover:bg-gray-700 transition flex justify-between items-center group">
                        <span className="text-white group-hover:text-accent-primary">{club.name}</span>
                        <span className="text-xs text-gray-500">Edit &rarr;</span>
                      </Link>
                    ))}
                    <Link href="/clubs/create" className="text-xs text-accent-primary hover:underline mt-2 block">
                      + Add another club
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">You haven't created a club profile yet.</p>
                    <Link href="/clubs/create" className="btn-secondary text-xs w-full block text-center">
                      Create Club Profile
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/dashboard/club/manage" className="card hover:bg-gray-800 transition cursor-pointer group">
                <h3 className="text-xl font-bold text-accent-primary group-hover:text-white mb-2">Manage All</h3>
                <p className="text-gray-400 text-sm">View and manage all events, bookings, and applications.</p>
              </Link>
            </div>

            {/* Quick Links to dedicated management pages - Implemented as a separate page for cleaner UI */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Management Center</h2>
                <Link href="/dashboard/club/manage" className="text-accent-primary hover:underline">
                  Go to detailed view &rarr;
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-400">
                <div>
                  <p>Manage your <strong>Bookings</strong> to fill your tables.</p>
                  <p className="mt-2">Review <strong>Applications</strong> from DJs and Promoters.</p>
                </div>
                <div>
                  <p>Update <strong>Events</strong> status (Mark functionality/expired).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === 'promoter' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Promoter Dashboard</h2>
                <div className="space-y-4">
                  <Link href="/gigs" className="btn-primary w-full block text-center">
                    Find Gigs to Promote
                  </Link>
                  <Link href="/dashboard/profile" className="btn-secondary w-full block text-center">
                    Edit Profile
                  </Link>
                </div>
              </div>
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">My Applications</h2>
                {stats.applications && stats.applications.length > 0 ? (
                  <div className="space-y-3">
                    {stats.applications.map((app: any) => (
                      <div key={app.id} className="p-3 bg-gray-800 rounded flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{app.event?.title || app.gig?.title || 'Unknown Gig'}</p>
                          <p className="text-xs text-gray-400">{app.event?.club?.name || app.gig?.club?.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${app.status === 'accepted' ? 'bg-green-900 text-green-300' :
                          app.status === 'rejected' ? 'bg-red-900 text-red-300' :
                            'bg-yellow-900 text-yellow-300'
                          }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">You haven't applied to any gigs yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {user.role === 'dj' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">DJ Dashboard</h2>
                <div className="space-y-4">
                  <Link href="/gigs" className="btn-primary w-full block text-center">
                    Find DJ Gigs
                  </Link>
                  <Link href="/dashboard/profile" className="btn-secondary w-full block text-center">
                    Edit Profile & Upload Music
                  </Link>
                  <div className="p-4 bg-gray-800 rounded">
                    <p className="text-sm text-gray-400">Complete your profile with music samples to get more gigs.</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold mb-4">My Applications</h2>
                {stats.applications && stats.applications.length > 0 ? (
                  <div className="space-y-3">
                    {stats.applications.map((app: any) => (
                      <div key={app.id} className="p-3 bg-gray-800 rounded flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{app.event?.title || app.gig?.title || 'Unknown Gig'}</p>
                          <p className="text-xs text-gray-400">{app.event?.club?.name || app.gig?.club?.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${app.status === 'accepted' ? 'bg-green-900 text-green-300' :
                          app.status === 'rejected' ? 'bg-red-900 text-red-300' :
                            'bg-yellow-900 text-yellow-300'
                          }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">You haven't applied to any gigs yet.</p>
                )}
              </div>
            </div>

            {/* My Work & Music Gallery */}
            {stats.musicLinks && stats.musicLinks.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <FiMusic className="w-6 h-6 text-neon-pink" />
                  <h2 className="text-2xl font-bold">My Work & Music</h2>
                  <span className="ml-auto px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm font-semibold">
                    {stats.musicLinks.length} track{stats.musicLinks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.musicLinks.map((link: string, idx: number) => {
                    // Check if it's a YouTube link
                    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)([a-zA-Z0-9_-]{11})/;
                    const youtubeMatch = link.match(youtubeRegex);
                    const videoId = youtubeMatch ? youtubeMatch[1] : null;

                    return (
                      <div key={idx} className="group">
                        {videoId ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative overflow-hidden rounded-lg bg-gray-800 aspect-video hover:opacity-80 transition"
                          >
                            <img
                              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                              alt={`Track ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex items-center justify-center transition">
                              <div className="text-white text-4xl">▶</div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                              <p className="text-white text-sm font-semibold">YouTube Mix {idx + 1}</p>
                            </div>
                          </a>
                        ) : (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition h-full flex flex-col items-center justify-center text-center"
                          >
                            <FiMusic className="w-8 h-8 text-accent-primary mb-2" />
                            <p className="text-sm font-semibold text-white truncate w-full">
                              {link.split('/').pop() || 'Music Link'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Click to listen</p>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <Link href="/dashboard/profile" className="btn-secondary w-full text-center">
                    Add More Music
                  </Link>
                </div>
              </div>
            )}

            {(!stats.musicLinks || stats.musicLinks.length === 0) && (
              <div className="card bg-gradient-to-r from-accent-primary/10 to-neon-pink/10 border border-accent-primary/20">
                <div className="flex items-center gap-4">
                  <FiMusic className="w-12 h-12 text-neon-pink flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">Upload Your Music Portfolio</h3>
                    <p className="text-sm text-gray-400">Add music links and videos to showcase your work. Club owners will see your portfolio when reviewing applications.</p>
                  </div>
                  <Link href="/dashboard/profile" className="btn-primary whitespace-nowrap">
                    Upload Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {user.role === 'admin' && (
          <div className="card bg-accent-primary/10 border-accent-primary">
            <h2 className="text-xl font-semibold mb-4 text-accent-primary">Admin Access</h2>
            <Link href="/admin" className="btn-primary w-full block text-center">
              Go to Admin Dashboard
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
