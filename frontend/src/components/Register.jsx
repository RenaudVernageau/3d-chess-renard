// src/components/Register.jsx
import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    avatar: ""  // contiendra la Data URL
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image trop volumineuse (max 2 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setForm(f => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Les mots de passe doivent correspondre");
      return;
    }
    try {
      await register({
        username: form.username,
        email:    form.email,
        password: form.password,
        avatar:   form.avatar,
      });
      navigate("/login");
    } catch (err) {
      setError(err.error || "Impossible de s’inscrire");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-b from-white to-stone-100
                    dark:from-stone-800 dark:to-stone-900
                    transition-colors duration-500">
      <form
        onSubmit={handleSubmit}
        className="bg-stone-800 p-8 rounded-lg shadow-xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Inscription
        </h1>

        {/* Avatar preview */}
        <div className="mb-6 flex justify-center">
          <div
            className="w-24 h-24 rounded-full bg-stone-700 overflow-hidden
                       cursor-pointer border-2 border-stone-600"
            onClick={handleAvatarClick}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Aperçu avatar"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center
                              h-full text-stone-400 text-2xl">
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

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <label className="block mb-4">
          <span className="text-stone-300">Nom d’utilisateur</span>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            minLength={3}
            className="mt-1 block w-full px-3 py-2 bg-stone-700 text-white rounded
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <label className="block mb-4">
          <span className="text-stone-300">Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-stone-700 text-white rounded
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <label className="block mb-4">
          <span className="text-stone-300">Mot de passe</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            className="mt-1 block w-full px-3 py-2 bg-stone-700 text-white rounded
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <label className="block mb-6">
          <span className="text-stone-300">Confirmez le mot de passe</span>
          <input
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-stone-700 text-white rounded
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <button
          type="submit"
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white
                     font-semibold rounded-lg transition"
        >
          S’inscrire
        </button>

        <p className="mt-4 text-stone-400 text-center text-sm">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-green-400 hover:underline">
            Connectez-vous
          </Link>
        </p>
      </form>
    </div>
  );
}
