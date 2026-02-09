'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiClock, FiUsers, FiCreditCard } from 'react-icons/fi';

interface BookingFormProps {
    event?: any;
    club: any;
    onSuccess?: () => void;
}

export default function BookingForm({ event, club, onSuccess }: BookingFormProps) {
    const { register, handleSubmit, reset } = useForm();
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const payload = {
                club: club.id,
                event: event?.id, // Optional
                ...data,
                bookingType: data.bookingType || 'general', // Default
                numberOfGuests: parseInt(data.numberOfGuests),
            };

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                // Friendly message for unauthenticated users
                if (res.status === 401) {
                    toast.error('Please log in first to make a booking');
                    setSubmitting(false);
                    return;
                }

                const error = await res.json();
                throw new Error(error.error || 'Failed to book');
            }

            toast.success('Reservation request sent!');
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
            <h3 className="text-xl font-bold mb-4">Make a Reservation</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <div className="relative">
                        <FiCalendar className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="date"
                            required
                            defaultValue={event?.date ? new Date(event.date).toISOString().split('T')[0] : ''}
                            {...register('date')}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:border-accent-primary"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Time</label>
                    <div className="relative">
                        <FiClock className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="time"
                            required
                            defaultValue={event?.startTime || ''}
                            {...register('time')}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:border-accent-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Guests</label>
                    <div className="relative">
                        <FiUsers className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="number"
                            min="1"
                            required
                            {...register('numberOfGuests')}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 w-full focus:outline-none focus:border-accent-primary"
                            placeholder="2"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <div className="relative">
                        <select
                            {...register('bookingType')}
                            className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-3 pr-4 w-full focus:outline-none focus:border-accent-primary appearance-none"
                        >
                            <option value="general">General Entry</option>
                            <option value="table">Table Reservation</option>
                            <option value="booth">VIP Booth</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <textarea
                    {...register('specialRequests')}
                    placeholder="Special requests? (e.g. Birthday, Accessibility)"
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 w-full focus:outline-none focus:border-accent-primary h-24 resize-none"
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex justify-center items-center"
            >
                {submitting ? 'Sending...' : 'Request Reservation'}
            </button>
        </form>
    );
}
