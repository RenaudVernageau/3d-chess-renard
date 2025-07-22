// src/components/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchUser, updateUser } from "../api/users";

export default function Profile() {
  const { user } = useAuth();        // { userId, username, token, email?, avatar? }
  const { userId } = user;
  const [form, setForm] = useState({ username: "", avatar: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // Charger le profil au montage
  useEffect(() => {
    (async () => {
      try {
        const u = await fetchUser(userId);
        setForm({
          username: u.username,
          avatar: u.avatar || "",
        });
        setAvatarPreview(u.avatar || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
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
      setMessage("Image trop volumineuse (max 2 Mo)");
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
      await updateUser(userId, {
        username: form.username,
        avatar: form.avatar,
      });
      // si tu utilises avatar/username ailleurs depuis localStorage
      localStorage.setItem("username", form.username);
      localStorage.setItem("avatar", form.avatar);
      setMessage("Profil mis à jour ✅");
    } catch (err) {
      console.error(err);
      setMessage(err.error || "Erreur serveur");
    }
  };

  return (
    <div
      className="
        min-h-screen flex flex-col items-center justify-center
        bg-gradient-to-b from-white to-stone-100
        dark:from-stone-800 dark:to-stone-900
        transition-colors duration-500
      "
    >
      <form
        onSubmit={handleSubmit}
        className="bg-stone-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-6">Mon profil</h1>

        {/* Avatar */}
        <div className="mb-6">
          <div
            className="w-24 h-24 mx-auto rounded-full overflow-hidden cursor-pointer border-2 border-stone-600"
            onClick={handleAvatarClick}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-2xl">
                +
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Message d’erreur ou succès */}
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

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
        >
          Sauvegarder
        </button>
      </form>
    </div>
  );
}
