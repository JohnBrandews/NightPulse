'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
                toast.success('Reset link sent to your email');
            } else {
                toast.error(data.error || 'Failed to send reset link');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-night-darker flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link href="/" className="text-4xl font-bold text-gradient inline-block mb-2">
                        NightPulse
                    </Link>
                    <h2 className="text-2xl font-semibold">Forgot Password</h2>
                    <p className="text-gray-400 mt-2">Enter your email to receive a reset link</p>
                </div>

                <div className="card">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="bg-accent-primary/10 text-accent-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-white font-medium mb-2">Email Sent!</p>
                            <p className="text-gray-400 mb-6">
                                Please check your email (${email}) for instructions to reset your password.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-accent-primary hover:underline text-sm"
                            >
                                Didn't receive an email? Try again
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
