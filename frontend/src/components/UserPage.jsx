import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  fetchUser as apiFetchUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  // setUserRole as apiSetUserRole, // dispo si tu crées l’endpoint plus tard
} from "../api/users";
import { makeAvatarUrl } from "../utils/cloudinaryUpload";

export default function UserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // édition
  const [edit, setEdit] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  const isMe = me?._id === id;
  const isMod = ["moderator", "admin"].includes(me?.role);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const u = await apiFetchUser(id);
        if (!mounted) return;
        setData(u);
        setUsername(u?.username || "");
        setAvatar(u?.avatar || u?.avatarUrl || "");
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setErr("Impossible de charger cet utilisateur.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const onSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setErr("");
    setOkMsg("");
    try {
      const payload = {};
      if (username && username !== data.username) payload.username = username.trim();
      if (avatar && avatar !== (data.avatar || "")) payload.avatar = avatar.trim();

      const updated = await apiUpdateUser(id, payload); // nécessite droits côté back si ≠ me
      setData(updated);
      setOkMsg("Profil mis à jour ✅");
      setEdit(false);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Supprimer ce compte ? Cette action est définitive.")) return;
    try {
      await apiDeleteUser(id); // nécessite rôle côté back
      navigate("/users", { replace: true });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Suppression impossible");
    }
  };

  const goMessage = () => navigate(`/messages?user=${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-stone-300">
        Chargement…
      </div>
    );
  }
  if (err) {
    return (
      <div className="flex items-center justify-center p-6 text-red-400">
        {err}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="max-w-md mx-auto p-6 bg-stone-900 border border-stone-700 rounded-xl text-stone-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-stone-400 hover:text-white"
      >
        ← Retour
      </button>

      <div className="flex flex-col items-center gap-3 mb-4">
        <img
          src={makeAvatarUrl(data.avatar || "/default-avatar.jpg", 128)}
          alt={data.username}
          className="w-24 h-24 rounded-full object-cover ring-2 ring-stone-600"
          onError={(e) => (e.currentTarget.src = "/default-avatar.jpg")}
        />
        <h3 className="text-lg font-semibold">{data.username}</h3>
        <p className="text-stone-400 text-sm">{data.email}</p>
        {data.role && (
          <span className="text-xs px-2 py-0.5 rounded bg-stone-800 border border-stone-700">
            Rôle : {data.role}
          </span>
        )}
      </div>

      <div className="flex gap-2 justify-center mb-4">
        {!isMe && (
          <button
            onClick={goMessage}
            className="rounded-lg bg-green-600 hover:bg-green-700 px-3 py-1.5 text-sm"
          >
            Message
          </button>
        )}

        {(isMe || isMod) && (
          <button
            onClick={() => { setEdit((v) => !v); setOkMsg(""); setErr(""); }}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm"
          >
            {edit ? "Annuler" : "Modifier"}
          </button>
        )}

        {isMod && !isMe && (
          <button
            onClick={onDelete}
            className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm"
          >
            Supprimer
          </button>
        )}
      </div>

      {okMsg && <p className="text-emerald-400 text-sm mb-2 text-center">{okMsg}</p>}
      {edit && (isMe || isMod) && (
        <form onSubmit={onSave} className="space-y-3">
          <label className="block">
            <span className="text-sm text-stone-300">Nom d’utilisateur</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9._-]+"
              className="mt-1 w-full rounded-md border border-stone-700 bg-stone-800 text-white px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-300">Avatar (URL)</span>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-md border border-stone-700 bg-stone-800 text-white px-3 py-2"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
