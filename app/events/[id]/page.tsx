'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import BookingForm from '@/components/BookingForm';
import ApplicationForm from '@/components/ApplicationForm';
import { FiCalendar, FiClock, FiMapPin, FiMusic, FiUsers, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';

export default function EventDetailPage() {
    const params = useParams();
    const [event, setEvent] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showBooking, setShowBooking] = useState(false);
    const [showApplication, setShowApplication] = useState(false);

    useEffect(() => {
        // Fetch User and Event
        Promise.all([
            fetch('/api/auth/me').then(res => res.json()),
            fetch(`/api/events/${params.id}`).then(res => res.json())
        ]).then(([userData, eventData]) => {
            if (userData.user) setUser(userData.user);
            if (eventData.event) setEvent(eventData.event);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [params.id]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!event) {
        return (
            <Layout>
                <div className="max-w-7xl mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold mb-4">Event not found</h1>
                    <Link href="/discover" className="text-accent-primary hover:underline">Back to Discover</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header / Banner */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 mb-8 border border-gray-800">
                    {/* Image placeholder or actual image */}
                    <div className="h-64 bg-gradient-to-r from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                        {event.image ? (
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                            <FiCalendar className="w-24 h-24 text-gray-700" />
                        )}
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                                    <span className="flex items-center">
                                        <FiMapPin className="mr-1" />
                                        <Link href={`/clubs/${event.club.id}`} className="hover:text-accent-primary hover:underline">
                                            {event.club.name}
                                        </Link>
                                        , {event.club.county}
                                    </span>
                                    <span className="flex items-center"><FiCalendar className="mr-1" /> {new Date(event.date).toLocaleDateString()}</span>
                                    <span className="flex items-center"><FiClock className="mr-1" /> {event.startTime} - {event.endTime}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${event.status === 'completed' ? 'bg-gray-700 text-gray-300' : 'bg-green-900/50 text-green-400'
                                    }`}>
                                    {event.status === 'completed' ? 'Event Ended' : 'Upcoming'}
                                </span>
                                {event.coverCharge && (
                                    <span className="text-xl font-bold text-accent-primary">
                                        KES {event.coverCharge}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">About the Event</h2>
                            <p className="text-gray-300 whitespace-pre-line">{event.description || 'No description provided.'}</p>
                        </div>

                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Details</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                <div className="flex items-center">
                                    <span className="w-8"><FiMusic className="w-5 h-5" /></span>
                                    <span>Type: {event.eventType}</span>
                                </div>
                                {event.dressCode && (
                                    <div className="flex items-center">
                                        <span className="w-8"><FiUsers className="w-5 h-5" /></span>
                                        <span>Dress Code: {event.dressCode}</span>
                                    </div>
                                )}
                                {event.ageRestriction && (
                                    <div className="flex items-center">
                                        <span className="w-8">18+</span>
                                        <span>Age Limit: {event.ageRestriction}+</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gigs / Opportunities */}
                        {(event.needsDj || event.needsPromoter) && (
                            <div className="card border-accent-primary/30">
                                <h2 className="text-xl font-bold mb-4 text-accent-primary">Opportunities</h2>
                                <p className="text-gray-300 mb-4">This event is looking for talent!</p>
                                <div className="flex gap-4">
                                    {event.needsDj && (
                                        <div className="bg-gray-800 p-4 rounded-lg flex-1">
                                            <div className="font-bold flex items-center mb-2"><FiMusic className="mr-2" /> DJ Wanted</div>
                                            <p className="text-sm text-gray-400 mb-3">Apply to play at this event.</p>
                                            {user?.role === 'dj' && (
                                                <button
                                                    onClick={() => { setShowApplication(true); setShowBooking(false); }}
                                                    className="btn-secondary w-full text-sm"
                                                    disabled={event.status === 'completed'}
                                                >
                                                    Apply as DJ
                                                </button>
                                            )}
                                            {user?.role !== 'dj' && user?.role !== 'promoter' && <span className="text-xs text-gray-500">Sign in as DJ to apply</span>}
                                        </div>
                                    )}
                                    {event.needsPromoter && (
                                        <div className="bg-gray-800 p-4 rounded-lg flex-1">
                                            <div className="font-bold flex items-center mb-2"><FiUsers className="mr-2" /> Promoter Wanted</div>
                                            <p className="text-sm text-gray-400 mb-3">Help promote this event.</p>
                                            {user?.role === 'promoter' && (
                                                <button
                                                    onClick={() => { setShowApplication(true); setShowBooking(false); }}
                                                    className="btn-secondary w-full text-sm"
                                                    disabled={event.status === 'completed'}
                                                >
                                                    Apply as Promoter
                                                </button>
                                            )}
                                            {user?.role !== 'dj' && user?.role !== 'promoter' && <span className="text-xs text-gray-500">Sign in as Promoter to apply</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <div className="card sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Reservation</h2>

                            {user ? (
                                <>
                                    {user.role === 'user' ? (
                                        !showBooking && !showApplication ? (
                                            <div className="space-y-4">
                                                <p className="text-gray-400 text-sm">Secure your spot at this event.</p>
                                                <button
                                                    onClick={() => setShowBooking(true)}
                                                    className="btn-primary w-full py-3 text-lg"
                                                    disabled={event.status === 'completed'}
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        ) : showBooking ? (
                                            <div>
                                                <button
                                                    onClick={() => setShowBooking(false)}
                                                    className="text-sm text-gray-400 hover:text-white mb-4 flex items-center"
                                                >
                                                    &larr; Cancel Booking
                                                </button>
                                                <BookingForm
                                                    event={event}
                                                    club={event.club}
                                                    onSuccess={() => setShowBooking(false)}
                                                />
                                            </div>
                                        ) : null
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            {user.role === 'club' ? 'You are viewing this as a Club Owner.' : 'Switch to a Regular User account to make reservations.'}
                                        </div>
                                    )}

                                    {/* Application Form Rendering for DJ/Promoter */}
                                    {(user.role === 'dj' || user.role === 'promoter') && showApplication && (
                                        <div>
                                            <button
                                                onClick={() => setShowApplication(false)}
                                                className="text-sm text-gray-400 hover:text-white mb-4 flex items-center"
                                            >
                                                &larr; Cancel Application
                                            </button>
                                            <ApplicationForm
                                                event={event}
                                                currentUser={user}
                                                onSuccess={() => setShowApplication(false)}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center space-y-4">
                                    <p className="text-gray-400">Sign in to book or apply.</p>
                                    <Link href="/login" className="btn-primary w-full block">Log In</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
