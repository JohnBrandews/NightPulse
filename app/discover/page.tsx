'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FiSearch, FiMapPin, FiUsers } from 'react-icons/fi';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

export default function DiscoverPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'people' | 'clubs'>('people');
  const [filters, setFilters] = useState({
    county: '',
    lookingFor: '',
    gender: '',
  });

  useEffect(() => {
    loadData();
  }, [filters, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'people') {
        const params = new URLSearchParams();
        if (filters.county) params.append('county', filters.county);
        if (filters.lookingFor) params.append('lookingFor', filters.lookingFor);
        if (filters.gender) params.append('gender', filters.gender);

        const res = await fetch(`/api/users/search?${params}`);
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const params = new URLSearchParams();
        if (filters.county) params.append('county', filters.county);
        params.append('verified', 'true');

        const res = await fetch(`/api/clubs?${params}`);
        const data = await res.json();
        setClubs(data.clubs || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover</h1>
          <p className="text-gray-400">Find clubbing companions and amazing venues</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-night-lighter">
          <button
            onClick={() => setActiveTab('people')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'people'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`pb-4 px-4 font-semibold transition-colors ${
              activeTab === 'clubs'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Clubs
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">County</label>
              <select
                value={filters.county}
                onChange={(e) => setFilters({ ...filters, county: e.target.value })}
                className="input-field"
              >
                <option value="">All Counties</option>
                {KENYA_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'people' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Looking For</label>
                  <select
                    value={filters.lookingFor}
                    onChange={(e) => setFilters({ ...filters, lookingFor: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {activeTab === 'people' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user._id} className="card">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-night-lighter flex items-center justify-center">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-16 h-16 rounded-full" />
                    ) : (
                      <FiUsers className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    {user.county && (
                      <p className="text-gray-400 text-sm flex items-center">
                        <FiMapPin className="w-4 h-4 mr-1" />
                        {user.county}
                      </p>
                    )}
                  </div>
                </div>
                {user.bio && <p className="text-gray-300 text-sm mb-4">{user.bio}</p>}
                <Link
                  href={`/profile/${user._id || user.id}`}
                  className="btn-primary w-full block text-center"
                >
                  View Profile
                </Link>
              </div>
            ))}
            {users.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No users found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <div key={club._id} className="card">
                <div className="mb-4">
                  <h3 className="font-semibold text-xl mb-2">{club.name}</h3>
                  <p className="text-gray-400 text-sm flex items-center mb-2">
                    <FiMapPin className="w-4 h-4 mr-1" />
                    {club.county}
                  </p>
                  {club.musicType && club.musicType.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {club.musicType.map((type: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-accent-primary/20 text-accent-primary rounded text-xs"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {club.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{club.description}</p>
                )}
                <Link
                  href={`/clubs/${club._id}`}
                  className="btn-primary w-full block text-center"
                >
                  View Club
                </Link>
              </div>
            ))}
            {clubs.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No clubs found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
