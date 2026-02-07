import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'NightPulse - Nightlife Social Discovery & Club Bookings',
  description: 'Connect with clubbing companions, discover clubs, and book reservations all in one place',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#fff',
              border: '1px solid #2a2a34',
            },
          }}
        />
      </body>
    </html>
  );
}
