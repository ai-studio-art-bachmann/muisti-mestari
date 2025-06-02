import React, { useState } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { DynamicResponsePanel } from '@/components/DynamicResponsePanel';
import { InteractionPanel } from '@/components/InteractionPanel';
import { useConversation } from '@/hooks/useConversation';
import { ConversationConfig } from '@/types/voice';
import { getTranslations } from '@/utils/translations';

const Index = () => {
  const [config, setConfig] = useState<ConversationConfig>({
    language: 'fi',
    webhookUrl: 'https://n8n.artbachmann.eu/webhook/my-memory'
  });

  const { voiceState, messages, handleVoiceInteraction, reset, isDisabled, isWaitingForClick } = useConversation(config);
  const t = getTranslations(config.language);

  const handleLanguageChange = (language: ConversationConfig['language']) => {
    setConfig(prev => ({ ...prev, language }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col h-[100svh] overflow-hidden">
      {/* Header */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-2">
        <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-100 rounded-b-3xl">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#184560] mb-1 sm:mb-2">
              {t.headerTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
              {t.headerSubtitle}
            </p>
          </div>
        </header>
      </div>

      {/* Language Selector */}
      <div className="max-w-4xl mx-auto w-full px-4 mb-3">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 rounded-xl">
          <LanguageSelector
            currentLanguage={config.language}
            onLanguageChange={handleLanguageChange}
          />
        </div>
      </div>

      {/* Main Content Area - Fixed layout */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col px-4" 
           style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 180px)' }}>
        {/* Messages Panel - Fixed height with scroll */}
        <div style={{ margin: '0 0 10px 0', height: '40vh' }}>
          <DynamicResponsePanel 
            messages={messages}
            language={config.language}
          />
        </div>

        {/* Interaction Panel - Fixed at bottom */}
        <div style={{ margin: '10px 0' }}>
          <InteractionPanel
            voiceState={voiceState}
            onVoiceInteraction={handleVoiceInteraction}
            isVoiceDisabled={isDisabled}
            isWaitingForClick={isWaitingForClick}
            language={config.language}
            webhookUrl={config.webhookUrl}
            onReset={reset}
            hasMessages={messages.length > 0}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full px-4 mt-3 mb-2">
        <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-2 rounded-t-xl">
          <p className="text-xs text-gray-500 text-center font-medium">
            {t.footerText}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
