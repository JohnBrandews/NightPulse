'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { FiMapPin, FiMessageCircle, FiCalendar, FiCheckCircle, FiMusic } from 'react-icons/fi';
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
          <>
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">DJ Information</h2>
              {profile.djName && <p className="text-gray-300 mb-2"><strong>DJ Name:</strong> {profile.djName}</p>}
              {profile.djGenre && profile.djGenre.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2 font-semibold">Genres:</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.djGenre.map((genre: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.djBio && (
                <div>
                  <p className="text-gray-400 text-sm mb-1 font-semibold">About:</p>
                  <p className="text-gray-300">{profile.djBio}</p>
                </div>
              )}
            </div>

            {profile.djMusicLinks && profile.djMusicLinks.length > 0 && (
              <div className="card mb-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="text-neon-pink text-3xl">🎵</span>
                  My Work & Music
                </h2>
                <div className="space-y-4">
                  {profile.djMusicLinks.map((link: string, idx: number) => {
                    // Check if it's a YouTube link
                    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)([a-zA-Z0-9_-]{11})/;
                    const youtubeMatch = link.match(youtubeRegex);
                    const videoId = youtubeMatch ? youtubeMatch[1] : null;

                    return (
                      <div key={idx} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition">
                        {videoId ? (
                          <>
                            <iframe
                              width="100%"
                              height="250"
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={`DJ Performance ${idx + 1}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full"
                            ></iframe>
                            <div className="p-3">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-secondary hover:text-accent-primary text-sm font-medium flex items-center"
                              >
                                <FiMusic className="mr-2 flex-shrink-0" />
                                Watch on YouTube
                              </a>
                            </div>
                          </>
                        ) : (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 text-accent-secondary hover:text-accent-primary transition flex items-center"
                          >
                            <FiMusic className="mr-3 flex-shrink-0" />
                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium truncate">{link.split('/').pop() || link}</p>
                              <p className="text-xs text-gray-400">Click to open</p>
                            </div>
                            →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
