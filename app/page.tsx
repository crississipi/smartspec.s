'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut, SessionProvider } from 'next-auth/react';
import ChatInterface from './components/ChatInterface';
import LoginCard from './components/LoginCard';
import Notification from './components/Notification';
import { AnimatePresence } from 'framer-motion';

function HomeContent() {
  const { data: session, status } = useSession();
  const [nightMode, setNightMode] = useState(false);

  useEffect(() => {
    // Load user preference for night mode if logged in
    if (session?.user) {
      fetch('/api/user')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user.preferences) {
            setNightMode(data.user.preferences.nightMode);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  useEffect(() => {
    // Apply night mode class to body
    document.body.classList.toggle('night', nightMode);
  }, [nightMode]);

  if (status === 'loading') {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="app">
      <AnimatePresence>
        {!session && <LoginCard onLogin={() => {}} />}
      </AnimatePresence>
      {session && (
        <ChatInterface
          user={session.user}
          nightMode={nightMode}
          setNightMode={setNightMode}
          onLogout={() => signOut({ callbackUrl: '/' })}
        />
      )}
      <Notification />
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}
