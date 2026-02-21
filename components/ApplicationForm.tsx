'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiMusic, FiPhone, FiDollarSign } from 'react-icons/fi';

interface ApplicationFormProps {
    event?: any;
    gig?: any;
    currentUser: any; // Pre-fill data
    onSuccess?: () => void;
}

export default function ApplicationForm({ event, gig, currentUser, onSuccess }: ApplicationFormProps) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            phone: currentUser?.phone || '',
            musicLinks: currentUser?.djMusicLinks || '', // Basic heuristic
            salaryExpectation: '',
            message: ''
        }
    });
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const payload = {
                eventId: event?.id,
                gigId: gig?.id,
                ...data
            };

            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to apply');
            }

            toast.success('Application submitted successfully!');
            reset();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Apply for {event ? 'Event' : 'Gig'}</h3>
            <p className="text-sm text-gray-400 mb-4">You are applying for: <span className="text-white font-medium">{event?.title || gig?.title}</span></p>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                    <input
                        required
                        {...register('name')}
                        className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-accent-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                    <div className="relative">
                        <FiPhone className="absolute left-3 top-3 text-gray-500" />
                        <input
                            required
                            {...register('phone')}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:border-accent-primary"
                            placeholder="+254..."
                        />
                    </div>
                </div>
            </div>

            {currentUser.role === 'dj' && (
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Music Links / Mixes</label>
                    <div className="relative">
                        <FiMusic className="absolute left-3 top-3 text-gray-500" />
                        <textarea
                            {...register('musicLinks')}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:border-accent-primary h-20 resize-none"
                            placeholder="SoundCloud, Mixcloud links..."
                        ></textarea>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm text-gray-400 mb-1">Salary Expectation (KES per hour)</label>
                <div className="relative">
                    <FiDollarSign className="absolute left-3 top-3 text-gray-500" />
                    <input
                        type="number"
                        required
                        {...register('salaryExpectation')}
                        className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:border-accent-primary"
                        placeholder="e.g. 5000"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-1">Message to Club Owner</label>
                <textarea
                    {...register('message')}
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-accent-primary h-24 resize-none"
                    placeholder="Why should we hire you?"
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex justify-center items-center"
            >
                {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
        </form>
    );
}
