'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiCheck, FiX, FiTrash2, FiClock, FiCheckCircle, FiDownload, FiFileText, FiSend, FiTrendingUp, FiDollarSign, FiCalendar, FiBarChart2, FiMail } from 'react-icons/fi';

export default function ClubManagePage() {
    const [activeTab, setActiveTab] = useState<'events' | 'bookings' | 'invoices' | 'applications' | 'analytics'>('events');
    const [data, setData] = useState<any>({ events: [], bookings: [], applications: [], invoices: [] });
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creatingInvoice, setCreatingInvoice] = useState<string | null>(null);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eventsRes, bookingsRes, applicationsRes, invoicesRes] = await Promise.all([
                fetch('/api/events?includeInactive=true'),
                fetch('/api/bookings'),
                fetch('/api/applications?view=received'),
                fetch('/api/bookings/invoices')
            ]);

            const events = await eventsRes.json();
            const bookings = await bookingsRes.json();
            const applications = await applicationsRes.json();
            const invoices = await invoicesRes.json();

            setData({
                events: events.events || [],
                bookings: bookings.bookings || [],
                applications: applications.applications || [],
                invoices: invoices.invoices || []
            });
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/analytics/club');
            const data = await res.json();
            if (data.analytics) {
                setAnalytics(data.analytics);
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchAnalytics();
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
            fetchAnalytics();
        } catch (error) {
            toast.error('Failed to update booking');
        }
    };

    const handleApplicationAction = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/applications`, {
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

    const createInvoice = async (bookingId: string) => {
        setCreatingInvoice(bookingId);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/invoice`, {
                method: 'POST'
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.error && data.error.includes('already exists')) {
                    toast.error('Invoice already exists for this booking');
                } else {
                    throw new Error(data.error || 'Failed to create invoice');
                }
            } else {
                toast.success('Invoice created successfully');
                fetchData();
                fetchAnalytics();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create invoice');
        } finally {
            setCreatingInvoice(null);
        }
    };

    const sendInvoice = async (invoiceId: string) => {
        setSendingEmail(invoiceId);
        try {
            const res = await fetch(`/api/bookings/invoices/${invoiceId}/send`, {
                method: 'POST'
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send');
            }

            toast.success(data.message || 'Sent successfully');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send');
        } finally {
            setSendingEmail(null);
        }
    };

    const downloadInvoice = async (invoiceId: string, status: string) => {
        try {
            const res = await fetch(`/api/bookings/invoices/${invoiceId}/download`);

            if (!res.ok) throw new Error('Failed to download');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const prefix = status === 'paid' ? 'receipt' : 'invoice';
            a.download = `${prefix}-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`${status === 'paid' ? 'Receipt' : 'Invoice'} PDF downloaded successfully`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to download');
        }
    };

    const updateInvoiceStatus = async (invoiceId: string, status: 'pending' | 'paid' | 'overdraft') => {
        setUpdatingStatus(invoiceId);
        try {
            const res = await fetch(`/api/bookings/invoices/${invoiceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            if (status === 'paid') {
                toast.success('Marked as paid! Receipt sent to client.');
            } else {
                toast.success('Invoice status updated');
            }
            fetchData();
            fetchAnalytics();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Calculate invoice stats
    const pendingInvoices = data.invoices.filter((i: any) => i.status === 'pending');
    const paidInvoices = data.invoices.filter((i: any) => i.status === 'paid');
    const overdraftInvoices = data.invoices.filter((i: any) => i.status === 'overdraft');
    const totalPending = pendingInvoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
    const totalPaid = paidInvoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
    const totalOverdraft = overdraftInvoices.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Management Center</h1>
                    <button
                        onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FiBarChart2 /> View Analytics
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 mb-8 overflow-x-auto gap-2">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-6 py-3 font-medium transition whitespace-nowrap rounded-t-lg ${activeTab === 'events' ? 'text-accent-primary border-b-2 border-accent-primary bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Events
                    </button>
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`px-6 py-3 font-medium transition whitespace-nowrap rounded-t-lg ${activeTab === 'bookings' ? 'text-accent-primary border-b-2 border-accent-primary bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Bookings ({data.bookings.filter((b: any) => b.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-6 py-3 font-medium transition whitespace-nowrap rounded-t-lg ${activeTab === 'invoices' ? 'text-accent-primary border-b-2 border-accent-primary bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FiFileText className="inline mr-2" />
                        Invoices
                        {pendingInvoices.length > 0 && (
                            <span className="ml-2 bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingInvoices.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`px-6 py-3 font-medium transition whitespace-nowrap rounded-t-lg ${activeTab === 'applications' ? 'text-accent-primary border-b-2 border-accent-primary bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Applications ({data.applications.filter((a: any) => a.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}
                        className={`px-6 py-3 font-medium transition whitespace-nowrap rounded-t-lg ${activeTab === 'analytics' ? 'text-accent-primary border-b-2 border-accent-primary bg-gray-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FiTrendingUp className="inline mr-2" />
                        Analytics
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
                                                        booking.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                                                            'bg-blue-900/30 text-blue-400'
                                                    }`}>
                                                    {booking.status} - {booking.paymentStatus}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {booking.bookingType.toUpperCase()} - {booking.numberOfGuests} guests
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(booking.date).toLocaleDateString()} at {booking.time}
                                            </p>
                                            {booking.totalAmount && (
                                                <p className="text-sm text-accent-primary font-bold mt-1">
                                                    KES {booking.totalAmount.toLocaleString()}
                                                </p>
                                            )}
                                            {booking.specialRequests && (
                                                <p className="text-xs text-gray-500 mt-2 italic">"{booking.specialRequests}"</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!booking.invoice && booking.status !== 'rejected' && booking.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => createInvoice(booking.id)}
                                                    disabled={creatingInvoice === booking.id}
                                                    className="btn-primary text-sm flex items-center gap-2"
                                                >
                                                    <FiFileText size={16} />
                                                    {creatingInvoice === booking.id ? 'Creating...' : 'Create Invoice'}
                                                </button>
                                            )}
                                            {booking.invoice && (
                                                <button
                                                    onClick={() => { setActiveTab('invoices'); }}
                                                    className="btn-secondary text-sm flex items-center gap-2"
                                                >
                                                    <FiCheckCircle size={16} />
                                                    Invoice Created
                                                </button>
                                            )}
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
                                    </div>
                                ))}
                                {data.bookings.length === 0 && <p className="text-gray-500">No bookings found.</p>}
                            </div>
                        )}

                        {activeTab === 'invoices' && (
                            <div>
                                {/* Invoice Summary */}
                                <div className="grid md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-green-900/20 border border-green-700/50 p-4 rounded-xl">
                                        <p className="text-green-400 text-sm flex items-center gap-2">
                                            <FiDollarSign /> Total Revenue
                                        </p>
                                        <p className="text-2xl font-bold text-green-400">KES {totalPaid.toLocaleString()}</p>
                                        <p className="text-gray-400 text-sm">{paidInvoices.length} paid invoices</p>
                                    </div>
                                    <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl">
                                        <p className="text-yellow-400 text-sm flex items-center gap-2">
                                            <FiClock /> Pending
                                        </p>
                                        <p className="text-2xl font-bold text-yellow-400">KES {totalPending.toLocaleString()}</p>
                                        <p className="text-gray-400 text-sm">{pendingInvoices.length} pending invoices</p>
                                    </div>
                                    <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-xl">
                                        <p className="text-red-400 text-sm flex items-center gap-2">
                                            <FiTrendingUp /> Overdraft
                                        </p>
                                        <p className="text-2xl font-bold text-red-400">KES {totalOverdraft.toLocaleString()}</p>
                                        <p className="text-gray-400 text-sm">{overdraftInvoices.length} overdraft invoices</p>
                                    </div>
                                    <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-xl">
                                        <p className="text-blue-400 text-sm flex items-center gap-2">
                                            <FiFileText /> Total
                                        </p>
                                        <p className="text-2xl font-bold text-blue-400">{data.invoices.length}</p>
                                        <p className="text-gray-400 text-sm">All invoices</p>
                                    </div>
                                </div>

                                {/* Invoices List */}
                                <div className="space-y-4">
                                    {data.invoices.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No invoices yet. Generate an invoice from the Bookings tab.</p>
                                    ) : (
                                        data.invoices.map((invoice: any) => (
                                            <div key={invoice.id} className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <h3 className="text-lg font-bold">{invoice.clientName}</h3>
                                                            <span className={`px-2 py-0.5 text-xs rounded-full ${invoice.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                                                                invoice.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                                                                    invoice.status === 'overdraft' ? 'bg-red-900/30 text-red-400' :
                                                                        'bg-blue-900/30 text-blue-400'
                                                                }`}>
                                                                {invoice.status.toUpperCase()}
                                                            </span>
                                                            {invoice.emailSent && (
                                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <FiCheckCircle size={12} /> Sent
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-400 mt-1">
                                                            {invoice.invoiceNumber} • {invoice.booking?.bookingType?.toUpperCase()}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            {invoice.booking ? new Date(invoice.booking.date).toLocaleDateString() : 'N/A'} • {invoice.booking?.numberOfGuests} guests
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-accent-primary">
                                                            KES {(invoice.totalAmount || 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
                                                    <button
                                                        onClick={() => downloadInvoice(invoice.id, invoice.status)}
                                                        className="btn-secondary text-sm flex items-center gap-2"
                                                    >
                                                        <FiDownload size={16} /> Download {invoice.status === 'paid' ? 'Receipt' : 'Invoice'}
                                                    </button>
                                                    <button
                                                        onClick={() => sendInvoice(invoice.id)}
                                                        disabled={sendingEmail === invoice.id}
                                                        className="btn-primary text-sm flex items-center gap-2"
                                                    >
                                                        <FiMail size={16} />
                                                        {sendingEmail === invoice.id ? 'Sending...' : `Send ${invoice.status === 'paid' ? 'Receipt' : 'Invoice'}`}
                                                    </button>

                                                    {invoice.status !== 'paid' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                                                                disabled={updatingStatus === invoice.id}
                                                                className="px-4 py-2 rounded bg-green-600/20 text-green-500 hover:bg-green-600/30 transition text-sm flex items-center gap-2"
                                                            >
                                                                <FiCheck size={16} />
                                                                {updatingStatus === invoice.id ? 'Updating...' : 'Mark as Paid'}
                                                            </button>
                                                            <button
                                                                onClick={() => updateInvoiceStatus(invoice.id, 'overdraft')}
                                                                disabled={updatingStatus === invoice.id}
                                                                className="px-4 py-2 rounded bg-red-600/20 text-red-500 hover:bg-red-600/30 transition text-sm"
                                                            >
                                                                Mark Overdraft
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
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
                                                Applied for: <span className="text-white">{app.event?.title || app.gig?.title || 'Unknown'}</span>
                                            </p>
                                            {app.salaryExpectation && <p className="text-sm text-gray-400">Salary: {app.salaryExpectation}</p>}
                                            {app.phone && <p className="text-sm text-gray-400">Phone: {app.phone}</p>}
                                            {app.message && <p className="text-xs text-gray-500 mt-2 italic">"{app.message}"</p>}
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <Link
                                                href={`/profile/${app.applicant.id}`}
                                                className="px-4 py-2 bg-accent-primary/20 text-accent-primary rounded hover:bg-accent-primary/30 text-sm font-medium transition"
                                            >
                                                View Profile
                                            </Link>
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
                                    </div>
                                ))}
                                {data.applications.length === 0 && <p className="text-gray-500">No applications found.</p>}
                            </div>
                        )}

                        {activeTab === 'analytics' && analytics && (
                            <div className="space-y-6">
                                {/* Revenue Overview */}
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 p-6 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FiDollarSign className="text-green-400 text-2xl" />
                                            <p className="text-green-400 text-sm font-medium">Total Revenue</p>
                                        </div>
                                        <p className="text-4xl font-bold text-green-400">KES {analytics.totalRevenue.toLocaleString()}</p>
                                        <p className="text-gray-400 text-sm mt-2">From {analytics.paidInvoices} paid invoices</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 p-6 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FiBarChart2 className="text-blue-400 text-2xl" />
                                            <p className="text-blue-400 text-sm font-medium">Avg Monthly Revenue</p>
                                        </div>
                                        <p className="text-4xl font-bold text-blue-400">KES {Math.round(analytics.averageMonthlyRevenue).toLocaleString()}</p>
                                        <p className="text-gray-400 text-sm mt-2">Based on invoice history</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 p-6 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FiCalendar className="text-purple-400 text-2xl" />
                                            <p className="text-purple-400 text-sm font-medium">Total Invoices</p>
                                        </div>
                                        <p className="text-4xl font-bold text-purple-400">{analytics.totalInvoices}</p>
                                        <div className="flex gap-2 mt-2 text-xs">
                                            <span className="text-green-400">{analytics.paidInvoices} paid</span>
                                            <span className="text-yellow-400">• {analytics.pendingInvoices} pending</span>
                                            <span className="text-red-400">• {analytics.overdraftInvoices} overdraft</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Revenue Chart */}
                                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <FiTrendingUp /> Monthly Revenue Trend
                                    </h3>
                                    <div className="h-64 flex items-end justify-between gap-2">
                                        {analytics.monthlyData.map((data: any, idx: number) => {
                                            const maxRevenue = Math.max(...analytics.monthlyData.map((d: any) => d.revenue));
                                            const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="relative w-full">
                                                        <div
                                                            className="bg-gradient-to-t from-accent-primary to-accent-primary/60 rounded-t transition-all duration-300 group-hover:from-accent-primary/80 group-hover:to-accent-primary/40 cursor-pointer"
                                                            style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                                                        >
                                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                                                KES {data.revenue.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-400 rotate-0 md:rotate-0 whitespace-nowrap">{data.month}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Recent Transactions */}
                                <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
                                    {analytics.recentTransactions && analytics.recentTransactions.length > 0 ? (
                                        <div className="space-y-3">
                                            {analytics.recentTransactions.map((invoice: any) => (
                                                <div key={invoice.id} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                                                    <div>
                                                        <p className="font-semibold">{invoice.clientName}</p>
                                                        <p className="text-sm text-gray-400">{invoice.invoiceNumber} • {new Date(invoice.issueDate).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-bold ${invoice.status === 'paid' ? 'text-green-400' : invoice.status === 'overdraft' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                            KES {(invoice.totalAmount || 0).toLocaleString()}
                                                        </p>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${invoice.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                                                            invoice.status === 'overdraft' ? 'bg-red-900/30 text-red-400' :
                                                                'bg-yellow-900/30 text-yellow-400'
                                                            }`}>
                                                            {invoice.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No transactions yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
