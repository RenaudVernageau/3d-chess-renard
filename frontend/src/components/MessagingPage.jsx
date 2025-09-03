// src/components/MessagingPage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ConversationsList, ChatWindow } from "./MessagingComponents";

export default function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("user") || null;

  const [selectedUserId, setSelectedUserId] = useState(initial);

  // Synchronise l'état local <-> URL (y compris la remise à zéro)
  useEffect(() => {
    if (initial && initial !== selectedUserId) {
      setSelectedUserId(initial);
    }
    if (!initial && selectedUserId) {
      setSelectedUserId(null);
    }
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (id) => {
    if (!id) {
      setSelectedUserId(null);
      // Enlève complètement le paramètre ?user de l'URL
      setSearchParams({});
      return;
    }
    setSelectedUserId(id);
    setSearchParams({ user: id });
  };

  return (
    <div className="h-screen flex bg-stone-900">
      {/* LISTE DES CONVERSATIONS */}
      <div
        className={
          // Mobile : si une conversation est sélectionnée -> on cache la liste
          // Desktop (md+): toujours visible en colonne de gauche
          selectedUserId ? "hidden md:block md:w-1/3" : "w-full md:w-1/3"
        }
      >
        <ConversationsList
          onSelect={handleSelect}
          selectedId={selectedUserId}
        />
      </div>

      {/* Séparateur visible seulement sur desktop */}
      <div className="hidden md:block w-px bg-stone-700" />

      {/* FENÊTRE DE CHAT */}
      <div
        className={
          // Mobile : visible seulement quand une conversation est sélectionnée
          // Desktop (md+): toujours visible à droite
          selectedUserId ? "flex-1 flex flex-col" : "hidden md:flex md:flex-1"
        }
      >
        {selectedUserId ? (
          // Le bouton "Retour" dans ChatWindow fait navigate('/messages')
          // Ce composant détecte l'URL sans ?user et remet selectedUserId à null.
          <ChatWindow otherId={selectedUserId} />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-stone-400">
            Sélectionne une conversation pour démarrer
          </div>
        )}
      </div>
    </div>
  );
}
