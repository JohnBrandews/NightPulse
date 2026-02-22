'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { toast } from 'react-hot-toast';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

export default function EditClubPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        county: '',
        musicType: [] as string[],
        dressCode: '',
        capacity: '',
        description: '',
        website: '',
        phone: '',
        email: '',
        tablePrice: '',
        boothPrice: '',
        generalPrice: '',
    });

    const [musicInput, setMusicInput] = useState('');

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const res = await fetch(`/api/clubs/${params.id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                const club = data.club;
                setFormData({
                    name: club.name || '',
                    address: club.address || '',
                    county: club.county || KENYA_COUNTIES[0],
                    musicType: club.musicType || [],
                    dressCode: club.dressCode || '',
                    capacity: club.capacity?.toString() || '',
                    description: club.description || '',
                    website: club.website || '',
                    phone: club.phone || '',
                    email: club.email || '',
                    tablePrice: club.tablePrice?.toString() || '0',
                    boothPrice: club.boothPrice?.toString() || '0',
                    generalPrice: club.generalPrice?.toString() || '0',
                });
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load club details');
                setLoading(false);
            }
        };
        fetchClub();
    }, [params.id]);

    const handleMusicAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && musicInput.trim()) {
            e.preventDefault();
            if (!formData.musicType.includes(musicInput.trim())) {
                setFormData({
                    ...formData,
                    musicType: [...formData.musicType, musicInput.trim()],
                });
            }
            setMusicInput('');
        }
    };

    const removeMusicType = (type: string) => {
        setFormData({
            ...formData,
            musicType: formData.musicType.filter((t) => t !== type),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/clubs/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    capacity: parseInt(formData.capacity),
                    tablePrice: parseFloat(formData.tablePrice) || 0,
                    boothPrice: parseFloat(formData.boothPrice) || 0,
                    generalPrice: parseFloat(formData.generalPrice) || 0,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update club');
            }

            toast.success('Club profile updated successfully!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold mb-8">Edit Club Profile</h1>

                <form onSubmit={handleSubmit} className="space-y-6 card">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Club Name</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">County</label>
                            <select
                                className="input-field"
                                value={formData.county}
                                onChange={(e) => setFormData({ ...formData, county: e.target.value as any })}
                            >
                                {KENYA_COUNTIES.map((county) => (
                                    <option key={county} value={county}>
                                        {county}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="label">Address/Location</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Capacity</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="input-field"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Dress Code</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Smart Casual"
                                className="input-field"
                                value={formData.dressCode}
                                onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Phone Contact</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Email Contact</label>
                            <input
                                type="email"
                                className="input-field"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Website (Optional)</label>
                            <input
                                type="url"
                                className="input-field"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>

                        {/* Pricing Row */}
                        <div>
                            <label className="label">Table Booking Price (KES)</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={formData.tablePrice}
                                onChange={(e) => setFormData({ ...formData, tablePrice: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Booth Booking Price (KES)</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={formData.boothPrice}
                                onChange={(e) => setFormData({ ...formData, boothPrice: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">General Booking Price (KES)</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={formData.generalPrice}
                                onChange={(e) => setFormData({ ...formData, generalPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Music Types (Press Enter to add)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={musicInput}
                            onChange={(e) => setMusicInput(e.target.value)}
                            onKeyDown={handleMusicAdd}
                            placeholder="House, Techno, Hip Hop..."
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.musicType.map((type) => (
                                <span key={type} className="badge bg-accent-primary text-white px-2 py-1 rounded-full text-sm flex items-center">
                                    {type}
                                    <button
                                        type="button"
                                        onClick={() => removeMusicType(type)}
                                        className="ml-2 hover:text-red-300"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <textarea
                            className="input-field"
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell us about your club..."
                        />
                    </div>

                    <div className="flex justify-end pt-4 gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
