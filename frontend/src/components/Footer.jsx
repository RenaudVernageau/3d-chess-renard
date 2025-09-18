import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-800 bg-stone-900/95 text-stone-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
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
          </nav>
        </div>
      </div>
    </footer>
  );
}
