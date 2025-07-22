// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchUser } from '../api/users';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ username: '', avatar: '' });

  useEffect(() => {
    (async () => {
      try {
        const u = await fetchUser(user.userId);
        setProfile({
          username: u.username,
          avatar: u.avatar || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    })();
  }, [user.userId]);

  return (
    <div
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-b from-white to-stone-100
        dark:from-stone-800 dark:to-stone-900
        transition-colors duration-500
      "
    >
      <div className="bg-stone-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Mon profil</h1>

        <div className="mb-6">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-stone-600">
            {profile.avatar
              ? (
                <img
                  src={profile.avatar}
                  alt="Avatar utilisateur"
                  className="object-cover w-full h-full"
                />
              )
              : (
                <div className="flex items-center justify-center h-full text-stone-400 text-2xl">
                  ?
                </div>
              )
            }
          </div>
        </div>

        <p className="text-white text-xl">{profile.username}</p>
      </div>
    </div>
  );
}
