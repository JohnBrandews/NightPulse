import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-night-darker via-night-dark to-night-darker"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="text-gradient">NightPulse</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Your ultimate nightlife social discovery platform
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Connect with clubbing companions, discover the hottest clubs, book reservations, 
              and experience the nightlife like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Get Started
              </Link>
              <Link href="/discover" className="btn-secondary text-lg px-8 py-4">
                Explore Clubs
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">
              Everything You Need for the Perfect Night Out
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">Find Clubbing Companions</h3>
                <p className="text-gray-400">
                  Connect with verified profiles of people looking to club together. 
                  Filter by city, vibe, and preferences.
                </p>
              </div>
              <div className="card text-center">
                <div className="text-4xl mb-4">🎵</div>
                <h3 className="text-xl font-semibold mb-2">Discover Clubs & Events</h3>
                <p className="text-gray-400">
                  Browse verified clubs, check out events, and book table reservations 
                  directly through the platform.
                </p>
              </div>
              <div className="card text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">Safe Messaging</h3>
                <p className="text-gray-400">
                  Chat with matches and send club invites in a safe, moderated environment. 
                  No explicit content allowed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-night-light">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Experience NightPulse?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of nightlife enthusiasts already on the platform
            </p>
            <Link href="/register" className="btn-primary text-lg px-8 py-4 inline-block">
              Create Your Account
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
