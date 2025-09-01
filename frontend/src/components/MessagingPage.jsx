// src/components/MessagingPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConversationsList, ChatWindow } from './MessagingComponents';

export default function MessagingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get('user');
  const [selectedUserId, setSelectedUserId] = useState(initial);

  // Sync state <-> URL
  useEffect(() => {
    if (initial && initial !== selectedUserId) {
      setSelectedUserId(initial);
    }
  }, [initial]);

  const handleSelect = id => {
    setSelectedUserId(id);
    setSearchParams({ user: id });
  };

  return (
    <div className="h-screen flex bg-stone-900">
      {/* Sidebar */}
      <div className="w-1/3 min-w-[240px]">
        <ConversationsList onSelect={handleSelect} selectedId={selectedUserId} />
      </div>

      {/* Divider */}
      <div className="w-px bg-stone-700" />

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <ChatWindow otherId={selectedUserId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400">
            Sélectionne une conversation pour démarrer
          </div>
        )}
      </div>
    </div>
  );
}
