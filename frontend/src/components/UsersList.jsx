import React, { useEffect, useState } from "react";
import { FiSearch, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import { FaUsers } from "react-icons/fa";
import { useNavigate, NavLink } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { useAuth } from "../hooks/useAuth";
import api from "../api";
import { formatRegisteredSince } from "../utils/dates";

function RoleBadge({ role }) {
  const base =
    "px-2 py-0.5 rounded-full text-[11px] border font-medium whitespace-nowrap";
  if (role === "admin")
    return (
      <span className={`${base} bg-amber-600/20 border-amber-500/40 text-amber-300`}>
        ADMIN
      </span>
    );
  if (role === "moderator")
    return (
      <span className={`${base} bg-emerald-600/20 border-emerald-500/40 text-emerald-300`}>
        MOD
      </span>
    );
  return (
    <span className={`${base} bg-stone-700/60 border-stone-600 text-stone-300`}>
      USER
    </span>
  );
}

function SuspendedBadge() {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] border font-medium whitespace-nowrap bg-red-700/20 border-red-600/50 text-red-300">
      SUSPENDU
    </span>
  );
}

export default function UsersList() {
  const { users, fetchUsers } = useUserStore();
  const { user: me } = useAuth();
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState("alphabetical");
  const [workingId, setWorkingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => setFilter(e.target.value);
  const handleSort = (e) => setSortKey(e.target.value);

  const sorted = [...users]
    .filter((u) => (u?.username || "").toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === "alphabetical")
        return (a.username || "").localeCompare(b.username || "");
      if (sortKey === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const handleMessage = (otherId) => {
    if (!otherId) return;
    navigate(`/messages?user=${encodeURIComponent(String(otherId))}`);
  };

  const canModerate = me?.role === "moderator" || me?.role === "admin";
  const isAdmin = me?.role === "admin";

  const toggleSuspend = async (target) => {
    if (!canModerate) return;
    const userId = target?._id ?? target?.id;
    if (!userId) return;
    const next = !target?.isSuspended;

    if (!window.confirm(`Confirmer ${next ? "suspendre" : "réactiver"} ${target?.username || "cet utilisateur"} ?`)) {
      return;
    }

    setWorkingId(userId);
    try {
      await api(`/users/${encodeURIComponent(String(userId))}/suspend`, {
        method: "PATCH",
        body: { isSuspended: next },
      });
      await fetchUsers();
    } catch (e) {
      console.error("toggleSuspend error", e);
      alert("Erreur lors de l’action.");
    } finally {
      setWorkingId(null);
    }
  };

  const deleteUser = async (target) => {
    if (!isAdmin) return;
    const userId = target?._id ?? target?.id;
    if (!userId) return;

    if (String(userId) === String(me?.userId)) {
      alert("Tu ne peux pas supprimer ton propre compte depuis ici.");
      return;
    }

    if (!window.confirm(`Supprimer définitivement ${target?.username || "cet utilisateur"} ?`)) {
      return;
    }

    setWorkingId(userId);
    try {
      await api(`/users/${encodeURIComponent(String(userId))}`, {
        method: "DELETE",
      });
      await fetchUsers();
    } catch (e) {
      console.error("deleteUser error", e);
      alert("Erreur lors de la suppression.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    // ✅ Pas de h-screen pour éviter le conflit avec le footer fixe
    <div className="min-h-[60vh] py-10 px-4 flex items-start justify-center">
      <div className="bg-stone-800 text-white rounded-lg p-6 w-full max-w-4xl mx-auto shadow-lg border border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center space-x-2 text-xl font-semibold">
            <FaUsers /> <span>Liste des utilisateurs</span>
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={sortKey}
              onChange={handleSort}
              className="bg-stone-700 px-2 py-1 rounded focus:outline-none"
            >
              <option value="alphabetical">A → Z</option>
              <option value="recent">Plus récents</option>
            </select>
          </div>
        </div>

        <div className="relative mb-6">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher par pseudo..."
            value={filter}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-stone-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {sorted.map((u, i) => {
            const userId = u?._id ?? u?.id;
            const encodedId = userId ? encodeURIComponent(String(userId)) : null;
            const avatar = u?.avatarUrl || u?.avatar || "/default-avatar.jpg";
            const isSelf = String(userId) === String(me?.userId);

            return (
              <li
                key={userId ?? i}
                className="bg-stone-700 hover:bg-stone-600 transition rounded p-3 flex items-center gap-4"
              >
                {encodedId ? (
                  <NavLink to={`/users/${encodedId}`} className="flex items-center space-x-4 flex-1 min-w-0">
                    <img
                      src={avatar}
                      alt={u?.username || "Utilisateur"}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                      onError={(e) => { e.currentTarget.src = "/default-avatar.jpg"; }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{u?.username || "—"}</p>
                        <RoleBadge role={u?.role || "user"} />
                        {u?.isSuspended ? <SuspendedBadge /> : null}
                      </div>
                      {/* Remplace l'email par l'ancienneté d'inscription */}
                      <p className="text-sm text-stone-300 truncate">
                        {u?.createdAt
                          ? formatRegisteredSince(u.createdAt)
                          : "Inscrit depuis : date inconnue"}
                      </p>
                    </div>
                  </NavLink>
                ) : (
                  <div className="flex items-center space-x-4 flex-1 min-w-0 opacity-60 cursor-not-allowed">
                    <img
                      src={avatar}
                      alt={u?.username || "Utilisateur"}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{u?.username || "—"}</p>
                        <RoleBadge role={u?.role || "user"} />
                        {u?.isSuspended ? <SuspendedBadge /> : null}
                      </div>
                      {/* Remplace l'email par l'ancienneté d'inscription */}
                      <p className="text-sm text-stone-300 truncate">
                        {u?.createdAt
                          ? formatRegisteredSince(u.createdAt)
                          : "Inscrit depuis : date inconnue"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions droite */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMessage(userId)}
                    disabled={!userId}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-1 rounded flex items-center"
                    title="Envoyer un message"
                  >
                    <FiMessageCircle className="mr-1" /> Message
                  </button>

                  {canModerate && !isSelf && (
                    <button
                      onClick={() => toggleSuspend(u)}
                      disabled={workingId === userId}
                      className={`px-3 py-1 rounded border ${
                        u?.isSuspended
                          ? "bg-emerald-700/30 hover:bg-emerald-700/50 border-emerald-600 text-emerald-200"
                          : "bg-red-700/30 hover:bg-red-700/50 border-red-600 text-red-200"
                      }`}
                      title={u?.isSuspended ? "Réactiver l'utilisateur" : "Suspendre l'utilisateur"}
                    >
                      {workingId === userId
                        ? "…"
                        : u?.isSuspended
                        ? "Réactiver"
                        : "Suspendre"}
                    </button>
                  )}

                  {isAdmin && !isSelf && (
                    <button
                      onClick={() => deleteUser(u)}
                      disabled={workingId === userId}
                      className="px-3 py-1 rounded bg-stone-800 hover:bg-stone-900 border border-stone-600 text-stone-200 flex items-center"
                      title="Supprimer l’utilisateur"
                    >
                      <FiTrash2 className="mr-1" />
                      {workingId === userId ? "…" : "Supprimer"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
