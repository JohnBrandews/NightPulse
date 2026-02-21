'use client';

import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
