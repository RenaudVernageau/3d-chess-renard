// src/components/Profile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateProfile, getUserById } from "../api/users";

// -------- Mon profil (utilisateur courant) --------
export function OwnProfile() {
  const { user, updateUser } = useAuth(); // <-- ajoute updateUser dans useAuth si pas déjà fait
  const initialUsername = user?.username || "";
  const initialAvatar = user?.avatar || user?.avatarUrl || "";

  const [username, setUsername] = useState(initialUsername);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const hasUsernameChanged = username.trim() !== initialUsername.trim();
  const hasAvatarChanged = avatar && avatar !== initialAvatar;
  const hasChanges = hasUsernameChanged || hasAvatarChanged;

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
    setOkMsg("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOkMsg("");

    try {
      const payload = {};
      if (hasUsernameChanged && username.trim()) payload.username = username.trim();
      if (hasAvatarChanged) payload.avatar = avatar;

      if (Object.keys(payload).length === 0) {
        setError("Aucune modification détectée.");
        setLoading(false);
        return;
      }

      const updated = await updateProfile(payload);

      // sync localStorage au minimum
      if (typeof updated?.username === "string") {
        localStorage.setItem("username", updated.username);
      }
      if (typeof updated?.avatar === "string") {
        localStorage.setItem("avatar", updated.avatar);
      }

      // si tu as ajouté updateUser dans useAuth, propage au contexte
      if (typeof updateUser === "function") {
        updateUser(updated);
      }

      setOkMsg("Profil mis à jour ✨");
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
        noValidate
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
            onChange={(e) => {
              setUsername(e.target.value);
              setOkMsg("");
              setError("");
            }}
            placeholder="Nom d'utilisateur"
            className="mt-1 w-full rounded-md border border-stone-700 bg-stone-800 text-white px-3 py-2"
          />
        </label>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {okMsg && <p className="text-emerald-400 text-sm mb-2">{okMsg}</p>}

        <button
          type="submit"
          disabled={loading || !hasChanges}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-white transition
            ${hasChanges ? "bg-blue-600 hover:bg-blue-700" : "bg-stone-700 cursor-not-allowed"}`}
          title={hasChanges ? "Enregistrer les modifications" : "Aucune modification"}
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}

// -------- Profil d’un autre utilisateur (affichage) --------
export function UserProfile({ id: propId }) {
  const { user } = useAuth();
  const userId = propId; // si tu passes l’id via la route, adapte en conséquence
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getUserById(userId);
        if (mounted) setData(res);
      } catch (e) {
        console.error(e);
        if (mounted) setErr("Erreur lors du chargement");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (err) {
    return (
      <div className="flex items-center justify-center p-6 text-red-400">
        {err}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-6 text-stone-300">
        Chargement…
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-stone-900 border border-stone-700 rounded-xl text-stone-100">
      <div className="flex flex-col items-center gap-3">
        <img
          src={data.avatar || "/default-avatar.jpg"}
          alt={data.username}
          className="w-24 h-24 rounded-full object-cover ring-2 ring-stone-600"
        />
        <h3 className="text-lg font-semibold">{data.username}</h3>
        <p className="text-stone-400 text-sm">{data.email}</p>
      </div>
    </div>
  );
}
