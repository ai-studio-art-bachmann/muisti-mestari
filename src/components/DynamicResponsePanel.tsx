
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/voice';
import { ChatBubble } from './ChatBubble';
import { getTranslations } from '@/utils/translations';

interface DynamicResponsePanelProps {
  messages: ChatMessage[];
  language: 'fi' | 'et' | 'en';
}

export const DynamicResponsePanel: React.FC<DynamicResponsePanelProps> = ({ 
  messages,
  language
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = getTranslations(language);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 bg-gray-50 rounded-lg shadow-sm"
      style={{ 
        height: '40vh', 
        maxHeight: '40vh',
        flex: '0 0 auto', 
        scrollbarWidth: 'thin',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center text-sm sm:text-base">
            {t.pressToStart}
          </p>
        </div>
      ) : (
        <div className="space-y-2 w-full" style={{ marginTop: 'auto' }}>
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
};
