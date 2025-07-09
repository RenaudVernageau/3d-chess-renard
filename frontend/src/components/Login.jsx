// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { token, login } = useAuth();
  const [creds, setCreds] = useState({ username: "", password: "" });
  const nav = useNavigate();

  // si déjà connecté, on redirige au lobby
  useEffect(() => {
    if (token) nav("/lobby", { replace: true });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    await login(creds);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Connexion</h1>
      <form onSubmit={submit}>
        <input
          placeholder="Username"
          value={creds.username}
          onChange={(e) => setCreds({ ...creds, username: e.target.value })}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={creds.password}
          onChange={(e) => setCreds({ ...creds, password: e.target.value })}
        />
        <br />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
