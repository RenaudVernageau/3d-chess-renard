// src/components/Profile.jsx (partie OwnProfile)
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateProfile } from "../api/users";

export function OwnProfile() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || user?.avatarUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {};
      if (username && username !== user.username) payload.username = username;
      if (avatar && avatar !== user.avatar) payload.avatar = avatar;

      if (Object.keys(payload).length === 0) {
        setError("Aucune modification détectée.");
        setLoading(false);
        return;
      }

      const updated = await updateProfile(payload);
      // 🔄 met à jour le contexte Auth
      login({ ...user, ...updated });

    } catch (err) {
      console.error("Profile update error:", err);
      setError("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-stone-900 text-stone-100 p-6 rounded-xl border border-stone-700"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Mon profil</h2>

        <div className="flex flex-col items-center mb-4">
          <img
            src={avatar || "/default-avatar.jpg"}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover mb-2 ring-2 ring-stone-600"
          />
          <label className="cursor-pointer text-blue-400 hover:underline">
            Changer la photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <label className="block mb-2">
          <span className="text-sm text-stone-300">Nom d'utilisateur</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="mt-1 w-full rounded-md border border-stone-700 bg-stone-800 text-white px-3 py-2"
          />
        </label>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white transition"
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}
