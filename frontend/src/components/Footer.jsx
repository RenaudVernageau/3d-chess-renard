// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone-800 bg-stone-900/95 text-stone-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm opacity-80">
            © {year} Immersive Chess — Tous droits réservés
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/legal"
              className="hover:text-white transition underline underline-offset-4 decoration-stone-600 hover:decoration-stone-300"
            >
              Mentions légales & Confidentialité
            </Link>
            {/* Si un jour tu ajoutes une page cookies séparée, décommente :
            <Link
              to="/cookies"
              className="hover:text-white transition underline underline-offset-4 decoration-stone-600 hover:decoration-stone-300"
            >
              Cookies
            </Link> */}
          </nav>
        </div>
      </div>
    </footer>
  );
}
