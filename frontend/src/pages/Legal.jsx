// src/pages/Legal.jsx
import React from "react";

export default function Legal() {
  return (
    <div className="min-h-screen bg-stone-900">
      <div className="max-w-3xl mx-auto px-4 py-12 text-stone-200">
        <h1 className="text-2xl font-bold mb-6">Mentions légales</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Éditeur du site</h2>
          <p>
            Ce site est édité par <strong>Renaud Vernageau</strong>.<br />
            Contact :{" "}
            <a
              href="mailto:renaudvernageau@icloud.com"
              className="text-blue-400 underline"
            >
              renaudvernageau@icloud.com
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Hébergement</h2>
          <p>
            Le site est hébergé par :<br />
            <strong>Vercel Inc.</strong><br />
            440 N Barranca Avenue #4133<br />
            Covina, CA 91723 — États-Unis<br />
            Site :{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              vercel.com
            </a>
          </p>
        </section>

        <h1 className="text-2xl font-bold mb-6">Politique de confidentialité</h1>

        <section className="mb-6">
          <p>
            Nous collectons uniquement les informations nécessaires au
            fonctionnement du service (compte, avatar, messagerie, parties).
            Aucune donnée n’est revendue à des tiers.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Données collectées</h2>
          <ul className="list-disc list-inside">
            <li>Pseudo et photo de profil (avatar stocké chez Cloudinary)</li>
            <li>Adresse e-mail pour l’inscription</li>
            <li>Messages et historique de parties (durée limitée)</li>
            <li>Logs techniques (sécurité / débogage)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Durées de conservation</h2>
          <ul className="list-disc list-inside">
            <li>Logs techniques : 12 mois</li>
            <li>Comptes inactifs : suppression après 3 ans</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d’un droit d’accès, de
            rectification, d’effacement et de portabilité. Pour toute demande :{" "}
            <a
              href="mailto:renaudvernageau@icloud.com"
              className="text-blue-400 underline"
            >
              renaudvernageau@icloud.com
            </a>.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <p>
            Ce site utilise uniquement des cookies strictement nécessaires (ex.
            maintien de session). Aucun cookie de mesure d’audience ou
            publicitaire n’est déposé. Si des cookies non essentiels sont ajoutés
            ultérieurement, une bannière de consentement sera mise en place.
          </p>
        </section>

        <p className="mt-8 text-sm text-stone-400">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}
