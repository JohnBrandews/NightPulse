'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">Invalid or missing reset token.</p>
                <Link href="/forgot-password" className="btn-primary">
                    Request new link
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: formData.password,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Password reset successful! Please login.');
                router.push('/login');
            } else {
                toast.error(data.error || 'Failed to reset password');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                    New Password
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="••••••••"
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm New Password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
            >
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-night-darker flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link href="/" className="text-4xl font-bold text-gradient inline-block mb-2">
                        NightPulse
                    </Link>
                    <h2 className="text-2xl font-semibold">Set New Password</h2>
                    <p className="text-gray-400 mt-2">Enter your new password below</p>
                </div>

                <div className="card">
                    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                        <ResetPasswordForm />
                    </Suspense>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-gray-400 hover:text-white text-sm">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
