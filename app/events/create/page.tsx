'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { toast } from 'react-hot-toast';

export default function CreateEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clubs, setClubs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        clubId: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        eventType: 'regular',
        coverCharge: 0,
        dressCode: '',
        ageRestriction: 18,
        needsDj: false,
        needsPromoter: false,
    });

    useEffect(() => {
        const loadMyClubs = async () => {
            try {
                const res = await fetch('/api/clubs?owner=me');
                if (!res.ok) return;
                const data = await res.json();
                if (data.clubs) setClubs(data.clubs);
            } catch (err) {
                console.error('Failed to load clubs for event creation', err);
            }
        };

        loadMyClubs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData };
        if (!payload.clubId && clubs.length > 0) {
            payload.clubId = clubs[0].id;
        }

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clubId: payload.clubId,
                    title: payload.title,
                    description: payload.description,
                    date: payload.date,
                    startTime: payload.startTime,
                    endTime: payload.endTime,
                    eventType: payload.eventType,
                    coverCharge: Number(payload.coverCharge) || undefined,
                    dressCode: payload.dressCode,
                    ageRestriction: Number(payload.ageRestriction) || undefined,
                    needsDj: payload.needsDj,
                    needsPromoter: payload.needsPromoter,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create event');
            }

            toast.success('Event created successfully!');
            router.push('/dashboard');
        } catch (error) {
            toast.error((error as Error).message || 'Error creating event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Post New Event</h1>

                <form onSubmit={handleSubmit} className="space-y-6 card">
                    {/* Club Selection if multiple */}
                    {clubs.length > 1 && (
                        <div>
                            <label className="label">Select Club</label>
                            <select
                                className="input-field"
                                value={formData.clubId}
                                onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                            >
                                {clubs.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* If NO clubs, show warning */}
                    {clubs.length === 0 && (
                        <div className="alert alert-warning">
                            Loading your clubs... (Or you haven't created one yet!)
                        </div>
                    )}

                    <div>
                        <label className="label">Event Title</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date</label>
                            <input
                                type="date"
                                required
                                className="input-field"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="label">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    className="input-field"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">End Time</label>
                                <input
                                    type="time"
                                    required
                                    className="input-field"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Description & Vibe</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Cover Charge (Ksh)</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={formData.coverCharge}
                                onChange={(e) => setFormData({ ...formData, coverCharge: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="label">Age Restriction</label>
                            <input
                                type="number"
                                min="18"
                                className="input-field"
                                value={formData.ageRestriction}
                                onChange={(e) => setFormData({ ...formData, ageRestriction: parseInt(e.target.value) || 18 })}
                            />
                        </div>
                    </div>

                    {/* Hiring Section */}
                    <div className="border-t border-gray-700 pt-4 mt-4">
                        <h3 className="text-lg font-semibold mb-2 text-accent-primary">Hiring / Opportunities</h3>
                        <p className="text-sm text-gray-400 mb-3">Does this event need external talent?</p>

                        <div className="flex space-x-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-accent-primary"
                                    checked={formData.needsDj}
                                    onChange={(e) => setFormData({ ...formData, needsDj: e.target.checked })}
                                />
                                <span>Need a DJ?</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-neon-pink"
                                    checked={formData.needsPromoter}
                                    onChange={(e) => setFormData({ ...formData, needsPromoter: e.target.checked })}
                                />
                                <span>Need Promoters?</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? 'Posting...' : 'Post Event'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
