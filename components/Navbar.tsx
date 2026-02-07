'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiHome, FiSearch, FiMessageCircle, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="bg-night-dark border-b border-night-lighter sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gradient">NightPulse</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/dashboard' ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-night-light'
                }`}
              >
                <FiHome className="w-5 h-5" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>

              {user.role === 'user' && (
                <>
                  <Link
                    href="/discover"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      pathname === '/discover' ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-night-light'
                    }`}
                  >
                    <FiSearch className="w-5 h-5" />
                    <span className="hidden md:inline">Discover</span>
                  </Link>
                  <Link
                    href="/messages"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      pathname === '/messages' ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-night-light'
                    }`}
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    <span className="hidden md:inline">Messages</span>
                  </Link>
                </>
              )}

              {(user.role === 'club' || user.role === 'promoter') && (
                <Link
                  href="/bookings"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === '/bookings' ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-night-light'
                  }`}
                >
                  <FiCalendar className="w-5 h-5" />
                  <span className="hidden md:inline">Bookings</span>
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-night-light"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="hidden md:inline">{user.name}</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-night-light border border-night-lighter rounded-lg shadow-xl">
                    <Link
                      href={`/profile/${user.id}`}
                      className="block px-4 py-2 hover:bg-night-lighter transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-night-lighter transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-night-lighter transition-colors flex items-center space-x-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
