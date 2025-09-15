import React, { useEffect, useState } from 'react';
import { FiSearch, FiMessageCircle } from 'react-icons/fi';
import { FaUsers } from 'react-icons/fa';
import { useNavigate, NavLink } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';

export function UsersList() {
  const { users, fetchUsers } = useUserStore();
  const [filter, setFilter]   = useState('');
  const [sortKey, setSortKey] = useState('alphabetical');
  const navigate               = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => setFilter(e.target.value);
  const handleSort   = (e) => setSortKey(e.target.value);

  const sorted = [...users]
    .filter((u) => (u?.username || '').toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'alphabetical') return (a.username || '').localeCompare(b.username || '');
      if (sortKey === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const handleMessage = (otherId) => {
    if (!otherId) return;
    navigate(`/messages?user=${encodeURIComponent(String(otherId))}`);
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-stone-800 text-white rounded-lg p-6 w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center space-x-2 text-xl font-semibold">
            <FaUsers /> <span>Liste des utilisateurs</span>
          </h2>
          <select
            value={sortKey}
            onChange={handleSort}
            className="bg-stone-700 px-2 py-1 rounded focus:outline-none"
          >
            <option value="alphabetical">A → Z</option>
            <option value="recent">Plus récents</option>
          </select>
        </div>

        <div className="relative mb-6">
          <FiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400"
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

        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
          {sorted.map((u, i) => {
            const userId = u?._id ?? u?.id;
            const encodedId = userId ? encodeURIComponent(String(userId)) : null;
            const avatar = u?.avatarUrl || u?.avatar || '/default-avatar.jpg';

            const RowContent = (
              <>
                <img
                  src={avatar}
                  alt={u?.username || 'Utilisateur'}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.jpg'; }}
                />
                <div>
                  <p className="font-medium">{u?.username || '—'}</p>
                  <p className="text-sm text-stone-400 truncate">{u?.email || ''}</p>
                </div>
              </>
            );

            return (
              <li
                key={userId ?? i}
                className="bg-stone-700 hover:bg-stone-600 transition rounded p-3 flex items-center"
              >
                {encodedId ? (
                  <NavLink to={`/users/${encodedId}`} className="flex items-center space-x-4 flex-1">
                    {RowContent}
                  </NavLink>
                ) : (
                  <div className="flex items-center space-x-4 flex-1 opacity-60 cursor-not-allowed">
                    {RowContent}
                  </div>
                )}

                <button
                  onClick={() => handleMessage(userId)}
                  disabled={!userId}
                  className="ml-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-1 rounded flex items-center"
                >
                  <FiMessageCircle className="mr-1" /> Message
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
