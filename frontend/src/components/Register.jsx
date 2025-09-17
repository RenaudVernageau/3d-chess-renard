// frontend/src/components/Register.jsx
import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCloudinarySignature } from "../api/upload";
import { updateMe as updateMeApi } from "../api/users";
import {
  uploadFileToCloudinary,
  uploadFileToCloudinaryUnsigned,
} from "../utils/cloudinaryUpload";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS;
const DEFAULT_FOLDER = "avatars";

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setError("Formats autorisés : JPEG, PNG, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (>5MB)");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Les mots de passe doivent correspondre");
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = "";

      if (avatarFile) {
        const token = localStorage.getItem("token");

        if (token) {
          // Cas connecté (rare à l’inscription) → upload signé
          const sig = await getCloudinarySignature({ folder: DEFAULT_FOLDER });
          const up = await uploadFileToCloudinary(avatarFile, sig);
          avatarUrl = up.secure_url;
        } else {
          // Cas standard (pas encore connecté) → upload unsigned
          const up = await uploadFileToCloudinaryUnsigned(avatarFile, {
            cloudName: CLOUD_NAME,
            uploadPreset: UPLOAD_PRESET,
            folder: DEFAULT_FOLDER,
          });
          avatarUrl = up.secure_url;
        }
      }

      // 1) Création du compte (on envoie avatar & avatarUrl pour couvrir les deux cas backend)
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        avatar: avatarUrl || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      // 2) Auto-login (ton endpoint attend le username)
      await login({ username: form.username.trim(), password: form.password });

      // 3) Sécurité : si besoin, pousse l’avatar via updateMe (idempotent)
      if (avatarUrl) {
        try {
          await updateMeApi({ avatar: avatarUrl, avatarUrl });
        } catch (_) {}
      }

      // 4) Go app
      navigate("/lobby");
    } catch (err) {
      console.error("Register error", err);
      setError(err?.message || err?.error || "Impossible de s’inscrire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center
                 bg-gradient-to-b from-white to-stone-100
                 dark:from-stone-800 dark:to-stone-900
                 transition-colors duration-500"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
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
            title="Choisir une photo de profil"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Aperçu avatar"
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.src = "/default-avatar.jpg";
                }}
              />
            ) : (
              <div className="flex items-center justify-center
                              h-full text-stone-400 text-2xl">+</div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
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
          disabled={loading}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60
                     text-white font-semibold rounded-lg transition"
        >
          {loading ? "Création du compte…" : "S’inscrire"}
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
