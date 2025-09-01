import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  fetchUser as apiFetchUser,
  updateUser as apiUpdateUser
} from "../api/users";
import { useUserStore } from "../store/useUserStore";

/**
 * Component to edit own profile (/profile)
 */
export function OwnProfile() {
  const { user } = useAuth(); // { id, username, ... }
  const userId = user.id;
  const [form, setForm] = React.useState({ username: "", avatar: "" });
  const [avatarPreview, setAvatarPreview] = React.useState("");
  const [message, setMessage] = React.useState("");
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await apiFetchUser(userId);
        setForm({ username: u.username, avatar: u.avatarUrl || "" });
        setAvatarPreview(u.avatarUrl || "");
      } catch (err) {
        console.error(err);
        setMessage("Erreur lors du chargement");
      }
    })();
  }, [userId]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image trop volumineuse (max 2 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setForm((f) => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiUpdateUser(userId, { username: form.username, avatar: form.avatar });
      setMessage("Profil mis à jour ✅");
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-stone-100 dark:from-stone-800 dark:to-stone-900">
      <form onSubmit={handleSubmit} className="bg-stone-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Mon profil</h1>

        {/* Avatar picker */}
        <div className="mb-6">
          <div
            className="w-24 h-24 mx-auto rounded-full overflow-hidden cursor-pointer border-2 border-stone-600"
            onClick={handleAvatarClick}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-2xl">+</div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Messages */}
        {message && <p className="text-red-400 text-sm mb-4">{message}</p>}

        {/* Username */}
        <label className="block mb-6 text-left">
          <span className="text-stone-300">Nom d’utilisateur</span>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            minLength={3}
            className="mt-1 block w-full px-3 py-2 bg-stone-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
          Sauvegarder
        </button>
      </form>
    </div>
  );
}

/**
 * Component to view another user's profile (/users/:id)
 */
export function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user.id;
  const { profile, fetchProfile, sendFriendRequest } = useUserStore();

  useEffect(() => {
    fetchProfile(id);
  }, [id]);

  if (!profile) return <div>Chargement…</div>;

  const isFriend = profile.friends.some((f) => f._id === userId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-stone-100 dark:from-stone-800 dark:to-stone-900">
      <div className="bg-stone-800 p-6 rounded-lg shadow-xl w-full max-w-md text-center space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <img src={profile.avatarUrl || '/default-avatar.jpg'} alt={profile.username} className="w-16 h-16 rounded-full object-cover" />
          <h2 className="text-xl font-semibold text-white">{profile.username}</h2>
        </div>

        <div className="flex flex-col space-y-3">
          {!isFriend && (
            <button
              onClick={() => sendFriendRequest(profile._id)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-black font-medium"
            >
              Ajouter en ami
            </button>
          )}

          {/* Nouveau: bouton pour envoyer un message */}
          <button
            onClick={() => navigate(`/messages?user=${profile._id}`)}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded text-white font-medium"
          >
            Envoyer un message
          </button>
        </div>

        <div className="text-left">
          <h3 className="font-semibold text-white mb-2">Amis ({profile.friends.length})</h3>
          <ul className="space-y-2">
            {profile.friends.map((f) => (
              <li key={f._id} className="flex items-center space-x-2">
                <img src={f.avatarUrl || '/default-avatar.jpg'} alt={f.username} className="w-8 h-8 rounded-full" />
                <span className="text-white">{f.username}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
