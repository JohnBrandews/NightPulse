'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'club' | 'promoter' | 'dj',
    gender: '',
    lookingFor: '',
    dateOfBirth: '',
    county: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Age validation for female users
    if (formData.gender === 'female' && formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 20) {
        toast.error('Ladies must be at least 20 years old to register');
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare data - only include fields that are relevant for the role
      const submitData: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        county: formData.county || undefined,
      };

      // Only include user-specific fields if role is 'user'
      if (formData.role === 'user') {
        submitData.gender = formData.gender || undefined;
        submitData.lookingFor = formData.lookingFor || undefined;
        submitData.dateOfBirth = formData.dateOfBirth || undefined;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Registration successful!');
        router.push('/dashboard');
      } else {
        // Show detailed error if available
        const errorMsg = data.details 
          ? `${data.error}: ${data.details.map((d: any) => d.message).join(', ')}`
          : data.error || 'Registration failed';
        toast.error(errorMsg);
        console.error('Registration error details:', data);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-darker flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-gradient inline-block mb-2">
            NightPulse
          </Link>
          <h2 className="text-2xl font-semibold">Create Your Account</h2>
          <p className="text-gray-400 mt-2">Join the nightlife community</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2">
                I am a...
              </label>
              <select
                id="role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="input-field"
              >
                <option value="user">Regular User</option>
                <option value="club">Club Owner</option>
                <option value="promoter">Promoter</option>
                <option value="dj">DJ</option>
              </select>
            </div>

            {formData.role === 'user' && (
              <>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="lookingFor" className="block text-sm font-medium mb-2">
                    Looking to club with
                  </label>
                  <select
                    id="lookingFor"
                    required
                    value={formData.lookingFor}
                    onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select...</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input-field"
                  />
                  {formData.gender === 'female' && (
                    <p className="text-sm text-gray-400 mt-1">
                      Ladies must be 20+ years old
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="county" className="block text-sm font-medium mb-2">
                County <span className="text-red-400">*</span>
              </label>
              <select
                id="county"
                required
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                className="input-field"
              >
                <option value="">Select a county...</option>
                {KENYA_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-accent-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
