'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { toast } from 'react-hot-toast';
import { FiMusic, FiVideo, FiSave, FiTrash2 } from 'react-icons/fi';

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        phone: '',
        profileImage: '',
        djGenre: [] as string[],
        djMusicLinks: [] as string[], // We'll store as JSON array of strings (URLs)
        salaryExpectation: '', // For future use
    });

    const [musicInput, setMusicInput] = useState('');
    const [genreInput, setGenreInput] = useState('');

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    // Parse JSON fields if they are strings, otherwise assume array
                    let musicLinks = data.user.djMusicLinks || [];
                    if (typeof musicLinks === 'string') {
                        try { musicLinks = JSON.parse(musicLinks); } catch { musicLinks = []; }
                    }

                    let genres = data.user.djGenre || [];
                    if (typeof genres === 'string') {
                        try { genres = JSON.parse(genres); } catch { genres = []; }
                    }

                    setFormData({
                        name: data.user.name || '',
                        bio: data.user.bio || '',
                        phone: data.user.phone || '',
                        profileImage: data.user.profileImage || '',
                        djGenre: genres,
                        djMusicLinks: musicLinks,
                        salaryExpectation: '',
                    });
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleAddMusic = () => {
        if (musicInput.trim()) {
            setFormData(prev => ({
                ...prev,
                djMusicLinks: [...prev.djMusicLinks, musicInput.trim()]
            }));
            setMusicInput('');
        }
    };

    const handleRemoveMusic = (index: number) => {
        setFormData(prev => ({
            ...prev,
            djMusicLinks: prev.djMusicLinks.filter((_, i) => i !== index)
        }));
    };

    const handleAddGenre = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && genreInput.trim()) {
            e.preventDefault();
            if (!formData.djGenre.includes(genreInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    djGenre: [...prev.djGenre, genreInput.trim()]
                }));
            }
            setGenreInput('');
        }
    };

    const handleRemoveGenre = (genre: string) => {
        setFormData(prev => ({
            ...prev,
            djGenre: prev.djGenre.filter(g => g !== genre)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    // Ensure arrays are stringified if backend expects strings, 
                    // or sent as arrays if backend handles it. 
                    // Prisma schema says String for these fields, so we likely need to JSON.stringify on server or here.
                    // Let's send raw arrays and handle stringify in API
                }),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            toast.success('Profile updated successfully');
            router.push('/dashboard');
        } catch (error) {
            toast.error('Something went wrong');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="p-12 text-center text-gray-400">Loading...</div></Layout>;
    if (!user) return <Layout><div className="p-12 text-center text-gray-400">Please log in</div></Layout>;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Edit Personal Profile</h1>

                <form onSubmit={handleSubmit} className="space-y-6 card">
                    <div>
                        <label className="label">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Bio / About Me</label>
                        <textarea
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            className="input-field min-h-[100px]"
                            placeholder="Tell clubs about yourself..."
                        />
                    </div>

                    <div>
                        <label className="label">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="input-field"
                            placeholder="+254..."
                        />
                    </div>

                    <div>
                        <label className="label">Profile Image</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-night-lighter overflow-hidden flex items-center justify-center">
                                {formData.profileImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.profileImage} alt="preview" className="w-20 h-20 object-cover" />
                                ) : (
                                    <span className="text-2xl">👤</span>
                                )}
                            </div>

                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            const fd = new FormData();
                                            fd.append('file', file);
                                            const uploadRes = await fetch('/api/users/upload-profile-image', {
                                                method: 'POST',
                                                body: fd,
                                            });
                                            const data = await uploadRes.json();
                                            if (!uploadRes.ok) {
                                                throw new Error(data?.error || 'Upload failed');
                                            }
                                            const imageUrl = data.url;
                                            setFormData(prev => ({ ...prev, profileImage: imageUrl }));

                                            // Immediately persist the profileImage to the user's profile
                                            try {
                                                const patchRes = await fetch('/api/users/profile', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ profileImage: imageUrl }),
                                                });
                                                const patchData = await patchRes.json();
                                                if (!patchRes.ok) {
                                                    console.error('Failed to save profile image', patchData);
                                                    toast.error('Uploaded but failed to save profile');
                                                } else {
                                                    toast.success('Image uploaded and saved to profile');
                                                }
                                            } catch (err) {
                                                console.error('Save profile error', err);
                                                toast.error('Uploaded but failed to save profile');
                                            }

                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Failed to upload image');
                                        }
                                    }}
                                    className="block"
                                />

                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="url"
                                        value={formData.profileImage}
                                        onChange={e => setFormData({ ...formData, profileImage: e.target.value })}
                                        className="input-field flex-1"
                                        placeholder="Or paste image URL"
                                    />
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, profileImage: '' }))} className="btn-secondary">
                                        Remove
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 mt-1">Upload an image from your device or paste a direct image URL.</p>
                            </div>
                        </div>
                    </div>

                    {user.role === 'dj' && (
                        <>
                            <div>
                                <label className="label">Genres (Press Enter to add)</label>
                                <input
                                    type="text"
                                    value={genreInput}
                                    onChange={e => setGenreInput(e.target.value)}
                                    onKeyDown={handleAddGenre}
                                    className="input-field"
                                    placeholder="House, Amapiano, Techno..."
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.djGenre.map(genre => (
                                        <span key={genre} className="badge bg-accent-primary text-white px-2 py-1 rounded-full text-sm flex items-center">
                                            {genre}
                                            <button type="button" onClick={() => handleRemoveGenre(genre)} className="ml-2 hover:text-red-300">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">Music / Mix Links (SoundCloud, Mixcloud, YouTube)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="url"
                                        value={musicInput}
                                        onChange={e => setMusicInput(e.target.value)}
                                        className="input-field flex-1"
                                        placeholder="https://soundcloud.com/..."
                                    />
                                    <button type="button" onClick={handleAddMusic} className="btn-secondary">Add</button>
                                </div>
                                <div className="space-y-2">
                                    {formData.djMusicLinks.map((link, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                                            <span className="text-sm text-gray-300 truncate">{link}</span>
                                            <button type="button" onClick={() => handleRemoveMusic(idx)} className="text-red-400 hover:text-red-300">
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end pt-4 gap-4">
                        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                            <FiSave />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
