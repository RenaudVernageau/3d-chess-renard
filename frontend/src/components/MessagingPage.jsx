import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useMedia from "../hooks/useMedia";
import { ConversationsList, ChatWindow } from "./MessagingComponents";

export default function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("user");
  const [selectedUserId, setSelectedUserId] = useState(initial);

  // mobile = ≤ 767px (breakpoint Tailwind md)
  const isMobile = useMedia("(max-width: 767px)");

  // Sync URL -> state
  useEffect(() => {
    if (initial && initial !== selectedUserId) {
      setSelectedUserId(initial);
    }
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sélection d'une conversation
  const handleSelect = (id) => {
    setSelectedUserId(id);
    setSearchParams(id ? { user: id } : {});
  };

  // Action "retour" (utilisée en mobile)
  const handleBack = () => {
    setSelectedUserId(null);
    setSearchParams({});
  };

  return (
    <div className="h-screen bg-stone-900 text-white">
      <div className="mx-auto h-full max-w-6xl flex">
        {/* -------------------------------------------------
            LISTE (Conversations)
            - Desktop (md+): toujours visible (w-1/3)
            - Mobile: cachée si une conversation est ouverte
           ------------------------------------------------- */}
        <aside
          className={[
            "border-r border-stone-800",
            "w-full md:w-1/3 md:block",
            isMobile && selectedUserId ? "hidden" : "block",
          ].join(" ")}
        >
          <ConversationsList onSelect={handleSelect} selectedId={selectedUserId} />
        </aside>

        {/* -------------------------------------------------
            CHAT (Fenêtre de conversation)
            - Desktop (md+): visible si un utilisateur est sélectionné
                              sinon affiche un écran vide “Sélectionne…”
            - Mobile: visible uniquement si une conversation est ouverte
           ------------------------------------------------- */}
        <main
          className={[
            "flex-1",
            // sur mobile on n'affiche le chat que si une conv est sélectionnée
            isMobile ? (selectedUserId ? "flex" : "hidden") : "flex",
          ].join(" ")}
        >
          {selectedUserId ? (
            <ChatWindow
              otherId={selectedUserId}
              // Si ton ChatWindow gère déjà un bouton "← Retour",
              // tu n'as rien à changer. S'il expose un onBack, passe-le ici:
              onBack={handleBack}
            />
          ) : (
            // Ecran d’attente (uniquement desktop)
            <div className="hidden md:flex flex-1 items-center justify-center text-stone-400">
              Sélectionne une conversation pour démarrer
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
