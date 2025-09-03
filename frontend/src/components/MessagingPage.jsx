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
      setSearchParams({});
      return;
    }
    setSelectedUserId(id);
    setSearchParams({ user: id });
  };

  return (
    <div className="h-screen flex bg-stone-900">
      {/* LISTE DES CONVERSATIONS */}
      <div className={selectedUserId ? "hidden md:block md:w-1/3" : "w-full md:w-1/3"}>
        <ConversationsList onSelect={handleSelect} selectedId={selectedUserId} />
      </div>

      {/* Séparateur (desktop) */}
      <div className="hidden md:block w-px bg-stone-700" />

      {/* FENÊTRE DE CHAT */}
      <div className={selectedUserId ? "flex-1 flex flex-col" : "hidden md:flex md:flex-1"}>
        {selectedUserId ? (
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
