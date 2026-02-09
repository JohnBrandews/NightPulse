'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FiMusic, FiMic, FiCalendar, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function GigsPage() {
    const [user, setUser] = useState<any>(null);
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    fetchOpportunities(data.user.role);
                }
            });
    }, []);

    const fetchOpportunities = async (role: string) => {
        try {
            let endpoint = '/api/events?';
            if (role === 'dj') endpoint += 'needsDj=true';
            else if (role === 'promoter') endpoint += 'needsPromoter=true';
            else endpoint += 'needsDj=true&needsPromoter=true'; // Show all if unsure

            const res = await fetch(endpoint);
            const data = await res.json();
            setOpportunities(data.events || []);
        } catch (error) {
            console.error('Failed to load gigs');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (eventId: string) => {
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, message: 'I am interested in this gig!' }),
            });

            if (res.ok) {
                toast.success('Application submitted!');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to apply');
            }
        } catch (error) {
            toast.error('Error applying');
        }
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold mb-8">
                    {user?.role === 'dj' ? 'DJ Gigs' : user?.role === 'promoter' ? 'Promoter Jobs' : 'Opportunities'}
                </h1>

                {loading ? (
                    <div className="text-center text-gray-400">Loading opportunities...</div>
                ) : opportunities.length === 0 ? (
                    <div className="text-center text-gray-400">No gigs available right now. Check back later!</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {opportunities.map((gig) => (
                            <div key={gig.id} className="card hover:border-accent-primary transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{gig.title}</h3>
                                        <p className="text-gray-400 text-sm flex items-center mt-1">
                                            <FiMapPin className="w-3 h-3 mr-1" />
                                            <Link href={`/clubs/${gig.club?.id}`} className="hover:text-accent-primary hover:underline">
                                                {gig.club?.name}
                                            </Link>, {gig.club?.county}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800 px-2 py-1 rounded text-xs">
                                        {new Date(gig.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <p className="text-gray-300 mb-4 line-clamp-3">{gig.description}</p>

                                <div className="flex justify-between items-center mt-auto">
                                    <div className="flex space-x-2">
                                        {gig.needsDj && <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded flex items-center"><FiMusic className="mr-1" /> DJ Needed</span>}
                                        {gig.needsPromoter && <span className="text-xs bg-pink-900 text-pink-200 px-2 py-1 rounded flex items-center"><FiMic className="mr-1" /> Promoter Needed</span>}
                                    </div>

                                    <Link
                                        href={`/events/${gig.id}`}
                                        className="btn-primary text-sm px-4 py-2"
                                    >
                                        View & Apply
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
