import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ⬅️ useNavigate ajouté
import { FiMessageCircle } from "react-icons/fi"; // icône bouton
import { useAuth } from "../hooks/useAuth";
import { updateMe as updateMeApi } from "../api/users";
import api from "../api";
import { getCloudinarySignature } from "../api/upload";
import {
  uploadFileToCloudinary,
  makeAvatarUrl,
} from "../utils/cloudinaryUpload";

/* --- Helpers API locaux (lecture profil d'un autre user) --- */
async function fetchUserById(userId) {
  return api(`/users/${userId}`, { method: "GET" });
}

/* -------- Mon profil -------- */
export function OwnProfile() {
  const { user, updateUser } = useAuth();
  const initialUsername = user?.username || "";
  const initialAvatar = user?.avatar || user?.avatarUrl || "";

  const [username, setUsername] = useState(initialUsername);
  const [avatarPreview, setAvatarPreview] = useState(initialAvatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const hasUsernameChanged = username.trim() !== initialUsername.trim();
  const hasAvatarChanged = !!avatarFile;

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
      setError("Formats autorisés : JPEG, PNG, WebP");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (>5MB)");
      return;
    }

    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    setError("");
    setOkMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasUsernameChanged && !hasAvatarChanged) {
      setError("Aucune modification détectée.");
      return;
    }

    setLoading(true);
    setError("");
    setOkMsg("");

    try {
      let avatarUrlFinal = initialAvatar;

      if (hasAvatarChanged) {
        const sig = await getCloudinarySignature();
        const up = await uploadFileToCloudinary(avatarFile, sig);
        avatarUrlFinal = up.secure_url;
      }

      const payload = {};
      if (hasUsernameChanged && username.trim())
        payload.username = username.trim();
      if (hasAvatarChanged) payload.avatar = avatarUrlFinal;

      const updated = await updateMeApi(payload);

      if (typeof updateUser === "function") {
        updateUser({
          username: updated.username,
          email: updated.email || user?.email || "",
          avatar: updated.avatar || avatarUrlFinal || "",
        });
      } else {
        if (updated?.username)
          localStorage.setItem("username", updated.username);
        if (updated?.avatar) localStorage.setItem("avatar", updated.avatar);
      }

      const finalUrl = updated.avatar || avatarUrlFinal || "";
      setAvatarPreview(makeAvatarUrl(finalUrl, 128));
      setAvatarFile(null);
      setOkMsg("Profil mis à jour ✨");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err?.message || "Erreur lors de la mise à jour");
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
            src={avatarPreview || "/default-avatar.jpg"}
            alt={`Avatar de ${username || "moi"}`}
            className="w-20 h-20 rounded-full object-cover mb-2 ring-2 ring-stone-600"
            onError={(e) => {
              e.currentTarget.src = "/default-avatar.jpg";
            }}
          />
          <label className="cursor-pointer text-blue-400 hover:underline">
            Changer la photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickAvatar}
            />
          </label>
        </div>

        <label className="block mb-2">
          <span className="text-sm text-stone-300">Nom d’utilisateur</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setOkMsg("");
              setError("");
            }}
            placeholder="Nom d’utilisateur"
            className="mt-1 w-full rounded-md border border-stone-700 bg-stone-800 text-white px-3 py-2"
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9._-]+"
          />
          <small className="text-stone-400">
            3–20 caractères. Lettres, chiffres, ., -, _
          </small>
        </label>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {okMsg && <p className="text-emerald-400 text-sm mb-2">{okMsg}</p>}

        <button
          type="submit"
          disabled={loading || (!hasAvatarChanged && !hasUsernameChanged)}
          className={`mt-4 w-full rounded-lg px-4 py-2 text-white transition
            ${
              hasAvatarChanged || hasUsernameChanged
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-stone-700 cursor-not-allowed"
            }`}
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}

/* -------- Profil d’un autre utilisateur (affichage) -------- */
export function UserProfile({ id: propId }) {
  // ⬇️ récupère l'id soit via prop (ancien usage), soit via l'URL /users/:id
  const { id: routeId } = useParams();
  const id = propId || routeId;

  const navigate = useNavigate(); // ⬅️ pour le bouton "Envoyer un message"

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    // garde-fou si l'id est absent ou "undefined"
    if (!id || id === "undefined") {
      setErr("ID utilisateur invalide.");
      setData(null);
      return () => {};
    }

    (async () => {
      try {
        const res = await fetchUserById(id);
        if (mounted) setData(res);
      } catch (e) {
        console.error(e);
        if (mounted) setErr("Impossible de charger cet utilisateur.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

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
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-xl text-stone-100 p-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src={makeAvatarUrl(data.avatar || "/default-avatar.jpg", 128)}
            alt={data.username}
            className="w-24 h-24 rounded-full object-cover ring-2 ring-stone-600"
            onError={(e) => {
              e.currentTarget.src = "/default-avatar.jpg";
            }}
          />
          <h3 className="text-lg font-semibold">{data.username}</h3>
          <p className="text-stone-400 text-sm">{data.email}</p>

          <button
            type="button"
            onClick={() =>
              navigate(`/messages?user=${encodeURIComponent(String(id))}`)
            }
            className="mt-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2"
            title={`Envoyer un message à ${data.username}`}
          >
            <FiMessageCircle className="text-lg" />
            <span>Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}
