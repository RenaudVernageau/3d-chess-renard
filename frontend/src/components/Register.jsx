// src/components/Register.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const [creds, setCreds] = useState({ username: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    await register(creds);
    alert("Inscrit ! Connectez-vous.");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Inscription</h1>
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
        <button type="submit">S’inscrire</button>
      </form>
    </div>
  );
}
