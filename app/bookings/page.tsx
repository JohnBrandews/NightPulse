'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadBookings();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success('Booking updated');
        loadBookings();
      } else {
        toast.error('Failed to update booking');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Bookings</h1>
          <p className="text-gray-400">
            {user?.role === 'club' ? 'Manage your club bookings' : 'View your reservations'}
          </p>
        </div>

        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <FiCalendar className="w-5 h-5 text-accent-primary" />
                    <h3 className="text-xl font-semibold">
                      {booking.club?.name || 'Club'}
                    </h3>
                    <span className={`font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-gray-400 text-sm">Date</p>
                      <p className="font-semibold">
                        {new Date(booking.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Time</p>
                      <p className="font-semibold">{booking.time}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Guests</p>
                      <p className="font-semibold">{booking.numberOfGuests}</p>
                    </div>
                    {booking.tableNumber && (
                      <div>
                        <p className="text-gray-400 text-sm">Table</p>
                        <p className="font-semibold">{booking.tableNumber}</p>
                      </div>
                    )}
                  </div>

                  {user?.role === 'club' && booking.user && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm">Booked by</p>
                      <p className="font-semibold">{booking.user.name}</p>
                      <p className="text-sm text-gray-400">{booking.user.email}</p>
                    </div>
                  )}

                  {booking.specialRequests && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm">Special Requests</p>
                      <p className="text-gray-300">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>

                {user?.role === 'club' && booking.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                      title="Confirm"
                    >
                      <FiCheck className="w-5 h-5 text-green-400" />
                    </button>
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'rejected')}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <FiX className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="card text-center py-12">
              <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No bookings found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
