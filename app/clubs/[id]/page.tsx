'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { FiMapPin, FiMusic, FiUsers, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ClubDetailPage() {
  const params = useParams();
  const [club, setClub] = useState<any>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    numberOfGuests: 1,
    bookingType: 'general' as 'table' | 'booth' | 'general',
    specialRequests: '',
  });

  useEffect(() => {
    loadClub();
  }, [params.id]);

  const loadClub = async () => {
    try {
      const res = await fetch(`/api/clubs/${params.id}`);
      const data = await res.json();
      setClub(data.club);
    } catch (error) {
      console.error('Failed to load club:', error);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          club: params.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Booking request submitted!');
        setShowBookingForm(false);
        setBookingData({
          date: '',
          time: '',
          numberOfGuests: 1,
          bookingType: 'general',
          specialRequests: '',
        });
      } else {
        toast.error(data.error || 'Failed to create booking');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  if (!club) {
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
          <h1 className="text-4xl font-bold mb-2">{club.name}</h1>
          <div className="flex items-center space-x-4 text-gray-400">
            <span className="flex items-center">
              <FiMapPin className="w-4 h-4 mr-1" />
              {club.county}
            </span>
            {club.capacity && (
              <span className="flex items-center">
                <FiUsers className="w-4 h-4 mr-1" />
                Capacity: {club.capacity}
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {club.description && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-300">{club.description}</p>
              </div>
            )}

            {club.musicType && club.musicType.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FiMusic className="w-5 h-5 mr-2" />
                  Music Type
                </h2>
                <div className="flex flex-wrap gap-2">
                  {club.musicType.map((type: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {club.dressCode && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-2">Dress Code</h2>
                <p className="text-gray-300">{club.dressCode}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Book a Reservation</h2>
              {!showBookingForm ? (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="btn-primary w-full"
                >
                  Make a Booking
                </button>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      required
                      value={bookingData.date}
                      onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      required
                      value={bookingData.time}
                      onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Guests</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={bookingData.numberOfGuests}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, numberOfGuests: parseInt(e.target.value) })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Booking Type</label>
                    <select
                      value={bookingData.bookingType}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, bookingType: e.target.value as any })
                      }
                      className="input-field"
                    >
                      <option value="general">General</option>
                      <option value="table">Table</option>
                      <option value="booth">Booth</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Special Requests</label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, specialRequests: e.target.value })
                      }
                      className="input-field"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="btn-primary flex-1">
                      Submit Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
