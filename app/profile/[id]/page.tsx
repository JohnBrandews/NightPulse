'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { FiMapPin, FiMessageCircle, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    loadProfile();
    loadCurrentUser();
  }, [params.id]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/users/${params.id as string}`);
      const data = await res.json();
      const user = data.user;
      if (user) {
        // Parse JSON strings if necessary
        try {
          if (typeof user.djGenre === 'string') user.djGenre = JSON.parse(user.djGenre);
          if (typeof user.djMusicLinks === 'string') user.djMusicLinks = JSON.parse(user.djMusicLinks);
        } catch (e) {
          console.error("Error parsing profile JSON", e);
        }
      }
      setProfile(user);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !profile) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: profile.id,
          content: messageContent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Message sent!');
        setMessageContent('');
        setShowMessageForm(false);
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUser && (currentUser.id === profile.id);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 rounded-full bg-night-lighter flex items-center justify-center">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <span className="text-4xl">{profile.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">{profile.name} {profile.isVerified && (<FiCheckCircle className="w-5 h-5 text-blue-500" title="Verified" />)}</h1>
              {profile.city && (
                <p className="text-gray-400 flex items-center mb-2">
                  <FiMapPin className="w-4 h-4 mr-1" />
                  {profile.city}
                </p>
              )}
              {profile.gender && (
                <p className="text-gray-400 mb-2">
                  {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                  {profile.lookingFor && ` • Looking for ${profile.lookingFor}`}
                </p>
              )}
            </div>
            {!isOwnProfile && currentUser && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowMessageForm(!showMessageForm)}
                  className="btn-primary"
                >
                  <FiMessageCircle className="w-4 h-4 mr-2" />
                  Message
                </button>
              </div>
            )}
          </div>
        </div>

        {showMessageForm && !isOwnProfile && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Send Message</h2>
            <form onSubmit={sendMessage} className="space-y-4">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Type your message..."
                required
              />
              <div className="flex space-x-2">
                <button type="submit" className="btn-primary">
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageForm(false);
                    setMessageContent('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {profile.bio && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-300">{profile.bio}</p>
          </div>
        )}

        {profile.role === 'dj' && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">DJ Profile</h2>
            {profile.djName && <p className="text-gray-300 mb-2">DJ Name: {profile.djName}</p>}
            {profile.djGenre && profile.djGenre.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Genres:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.djGenre.map((genre: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.djMusicLinks && profile.djMusicLinks.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Music & Video Links:</p>
                <div className="space-y-2">
                  {profile.djMusicLinks.map((link: string, idx: number) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-800 rounded hover:bg-gray-700 transition flex items-center text-accent-secondary truncate"
                    >
                      <FiMusic className="mr-2 flex-shrink-0" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {profile.djBio && (
              <div>
                <p className="text-gray-400 text-sm mb-1">DJ Bio:</p>
                <p className="text-gray-300">{profile.djBio}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
