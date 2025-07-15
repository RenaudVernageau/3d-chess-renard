// src/components/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate("/login");
    } catch {
      setError("Impossible de s’inscrire");
    }
  };

  return (
    <div
      className="
        min-h-screen flex flex-col items-center justify-center
        bg-gradient-to-b from-white to-gray-100
        dark:from-gray-800 dark:to-gray-900
        transition-colors duration-500
      "
    >
      <nav className="w-full max-w-md mb-6 px-4 flex justify-end"></nav>
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Inscription
        </h1>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <label className="block mb-4">
          <span className="text-gray-300">Nom d’utilisateur</span>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <label className="block mb-6">
          <span className="text-gray-300">Mot de passe</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>

        <button
          type="submit"
          className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
        >
          S’inscrire
        </button>

        <p className="mt-4 text-gray-400 text-center text-sm">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-green-400 hover:underline">
            Connectez-vous
          </Link>
        </p>
      </form>
    </div>
  );
}
