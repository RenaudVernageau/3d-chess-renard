// src/components/Profile.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchUser, updateUser } from '../api/users';

export default function Profile() {
  const { user, setUser } = useAuth(); // adapte si tu veux setUser
  const [form, setForm] = useState({
    username: '',
    email: '',
    avatar: '',
    password: '',
    confirm: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [message, setMessage] = useState('');
  const inputFile = useRef();

  // charge les données au montage
  useEffect(() => {
    (async () => {
      const u = await fetchUser(user.userId);
      setForm({
        username: u.username,
        email: u.email,
        avatar: u.avatar || '',
        password: '',
        confirm: '',
      });
      setAvatarPreview(u.avatar);
    })();
  }, [user.userId]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => inputFile.current.click();

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) {
      setMessage('Image trop lourde (<2 Mo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setForm(f => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    if (form.password && form.password !== form.confirm) {
      setMessage('Les mots de passe doivent correspondre');
      return;
    }
    try {
      const updated = await updateUser(user.userId, {
        username: form.username,
        email: form.email,
        avatar: form.avatar,
        ...(form.password ? { password: form.password } : {}),
      });
      setMessage('Profil mis à jour ✅');
      // mets à jour le contexte / localStorage
      setUser(u => ({ ...u, username: updated.username, email: updated.email, avatar: updated.avatar }));
    } catch (err) {
      setMessage(err.error || 'Erreur serveur');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4">Mon profil</h2>
      {message && <p className="mb-4 text-red-500">{message}</p>}

      <div className="mb-4">
        <div
          className="w-24 h-24 rounded-full overflow-hidden cursor-pointer border"
          onClick={handleAvatarClick}
        >
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
            : <div className="flex items-center justify-center h-full text-gray-400">+</div>
          }
        </div>
        <input
          ref={inputFile}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {['username','email','password','confirm'].map(name => (
          <div key={name}>
            <label className="block text-sm">{name === 'confirm' ? 'Confirmer mot de passe' : name.charAt(0).toUpperCase()+name.slice(1)}</label>
            <input
              type={name.includes('password')? 'password':'text'}
              name={name}
              value={form[name]}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
              {...(name!=='password'&&name!=='confirm'?{ required: true }:{})}
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Sauvegarder
        </button>
      </form>
    </div>
  );
}
