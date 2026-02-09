'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { toast } from 'react-hot-toast';
import { FiCheck, FiX, FiTrash2, FiClock, FiCheckCircle } from 'react-icons/fi';

export default function ClubManagePage() {
    const [activeTab, setActiveTab] = useState<'events' | 'bookings' | 'applications'>('events');
    const [data, setData] = useState<any>({ events: [], bookings: [], applications: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eventsRes, bookingsRes, applicationsRes] = await Promise.all([
                fetch('/api/events?includeInactive=true'), // Fetch all so we can see what to remove/restore?
                fetch('/api/bookings'),
                fetch('/api/applications?view=received')
            ]);

            const events = await eventsRes.json();
            const bookings = await bookingsRes.json();
            const applications = await applicationsRes.json();

            setData({
                events: events.events || [],
                bookings: bookings.bookings || [],
                applications: applications.applications || []
            });
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEventAction = async (id: string, action: 'delete' | 'finish' | 'suspend' | 'unsuspend') => {
        try {
            let method = 'PATCH';
            let body: any = undefined;
            if (action === 'delete') {
                method = 'DELETE';
            } else if (action === 'finish') {
                body = JSON.stringify({ status: 'completed' });
            } else if (action === 'suspend') {
                body = JSON.stringify({ action: 'suspend' });
            } else if (action === 'unsuspend') {
                body = JSON.stringify({ action: 'unsuspend' });
            }

            const res = await fetch(`/api/events/${id}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (!res.ok) throw new Error('Action failed');
            const msgMap: any = { delete: 'removed', finish: 'marked as finished', suspend: 'suspended', unsuspend: 'reinstated' };
            toast.success(`Event ${msgMap[action]}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update event');
        }
    };

    const handleBookingAction = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Action failed');
            toast.success(`Booking ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update booking');
        }
    };

    const handleApplicationAction = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/applications`, { // Uses PATCH on /api/applications with body
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (!res.ok) throw new Error('Action failed');
            toast.success(`Application ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update application');
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold mb-8">Management Center</h1>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 mb-8">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-6 py-3 font-medium transition ${activeTab === 'events' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Events
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-6 py-3 font-medium transition ${activeTab === 'bookings' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Bookings ({data.bookings.filter((b: any) => b.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`px-6 py-3 font-medium transition ${activeTab === 'applications' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        Applications ({data.applications.filter((a: any) => a.status === 'pending').length})
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'events' && (
                            <div className="space-y-4">
                                {data.events.map((event: any) => (
                                    <div key={event.id} className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold">{event.title}</h3>
                                            <p className="text-gray-400">{new Date(event.date).toLocaleDateString()} at {event.startTime}</p>
                                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${event.status === 'completed' ? 'bg-gray-700 text-gray-300' :
                                                    event.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                                }`}>
                                                {event.status === 'completed' ? 'Finished' : (event.isActive ? 'Active' : 'Removed')}
                                            </span>
                                        </div>
                                        <div className="flex space-x-3">
                                        {event.status !== 'completed' && (
                                        <>
                                        {event.isActive ? (
                                        <>
                                        <button
                                        onClick={() => handleEventAction(event.id, 'finish')}
                                        className="btn-secondary text-sm"
                                        title="Mark as Finished"
                                        >
                                        <FiClock className="mr-2 inline" /> Finished
                                        </button>
                                        <button
                                        onClick={() => handleEventAction(event.id, 'suspend')}
                                        className="px-4 py-2 rounded bg-red-600/20 text-red-500 hover:bg-red-600/30 transition"
                                        title="Suspend Event"
                                        >
                                        <FiTrash2 />
                                        </button>
                                        </>
                                        ) : (
                                        <button
                                        onClick={() => handleEventAction(event.id, 'unsuspend')}
                                        className="btn-secondary text-sm"
                                        title="Reinstate Event"
                                        >
                                        Reinstate
                                        </button>
                                        )}
                                        </>
                                        )}
                                        </div>
                                    </div>
                                ))}
                                {data.events.length === 0 && <p className="text-gray-500">No events found.</p>}
                            </div>
                        )}

                        {activeTab === 'bookings' && (
                            <div className="space-y-4">
                                {data.bookings.map((booking: any) => (
                                    <div key={booking.id} className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-bold">{booking.user.name}</h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${booking.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                                                        booking.status === 'confirmed' ? 'bg-green-900/30 text-green-400' :
                                                            'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {booking.bookingType.toUpperCase()} - {booking.numberOfGuests} guests
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(booking.date).toLocaleDateString()} at {booking.time}
                                            </p>
                                            {booking.specialRequests && (
                                                <p className="text-xs text-gray-500 mt-2 italic">"{booking.specialRequests}"</p>
                                            )}
                                        </div>
                                        {booking.status === 'pending' && (
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleBookingAction(booking.id, 'confirmed')}
                                                    className="p-2 rounded-full bg-green-600/20 text-green-500 hover:bg-green-600/30"
                                                    title="Accept"
                                                >
                                                    <FiCheck size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleBookingAction(booking.id, 'rejected')}
                                                    className="p-2 rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/30"
                                                    title="Reject"
                                                >
                                                    <FiX size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {data.bookings.length === 0 && <p className="text-gray-500">No bookings found.</p>}
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="space-y-4">
                                {data.applications.map((app: any) => (
                                    <div key={app.id} className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                                                    {app.applicant.profileImage ? (
                                                        <img src={app.applicant.profileImage} alt={app.applicant.name} className="w-10 h-10 object-cover" />
                                                    ) : null}
                                                </div>
                                                <h3 className="text-lg font-bold flex items-center gap-2">
                                                    {app.applicant.name}
                                                    {app.applicant.isVerified && <FiCheckCircle className="text-blue-500" title="Verified" />}
                                                    <span className="text-xs text-gray-400">({app.applicant.role})</span>
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${app.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                                                        app.status === 'accepted' ? 'bg-green-900/30 text-green-400' :
                                                            'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-300 space-y-1">
                                                {app.applicant.email && <p>Email: <span className="text-gray-400">{app.applicant.email}</span></p>}
                                                {app.applicant.county && <p>County: <span className="text-gray-400">{app.applicant.county}</span></p>}
                                                {app.applicant.bio && <p className="text-gray-400 text-xs italic">{app.applicant.bio}</p>}
                                            </div>
                                            <p className="text-sm text-gray-400 mt-2">
                                                Applied for: <span className="text-white">{app.event ? `Event: ${app.event.title}` : `Gig: ${app.gig?.title}`}</span>
                                            </p>
                                            {app.salaryExpectation && <p className="text-sm text-gray-400">Salary: {app.salaryExpectation}</p>}
                                            {app.phone && <p className="text-sm text-gray-400">Phone: {app.phone}</p>}
                                            {app.message && <p className="text-xs text-gray-500 mt-2 italic">"{app.message}"</p>}
                                        </div>
                                        {app.status === 'pending' && (
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleApplicationAction(app.id, 'accepted')}
                                                    className="p-2 rounded-full bg-green-600/20 text-green-500 hover:bg-green-600/30"
                                                    title="Accept"
                                                >
                                                    <FiCheck size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleApplicationAction(app.id, 'rejected')}
                                                    className="p-2 rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/30"
                                                    title="Reject"
                                                >
                                                    <FiX size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {data.applications.length === 0 && <p className="text-gray-500">No applications found.</p>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
