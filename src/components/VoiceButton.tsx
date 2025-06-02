
import React from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceState } from '@/types/voice';
import { cn } from '@/lib/utils';
import { getTranslations } from '@/utils/translations';

interface VoiceButtonProps {
  voiceState: VoiceState;
  onPress: () => void;
  disabled?: boolean;
  isWaitingForClick?: boolean;
  language: 'fi' | 'et' | 'en';
}

const getButtonState = (status: VoiceState['status'], isWaitingForClick: boolean = false, t: any) => {
  if (isWaitingForClick) {
    return {
      text: t.readyForClick,
      color: 'bg-orange-500 hover:bg-orange-600',
      pulse: true
    };
  }

  switch (status) {
    case 'idle':
      return {
        text: t.startConversation,
        color: 'bg-gray-400 hover:bg-gray-500',
        pulse: false
      };
    case 'greeting':
      return {
        text: t.greetingInProgress,
        color: 'bg-blue-500',
        pulse: true
      };
    case 'recording':
      return {
        text: t.listening,
        color: 'bg-red-500',
        pulse: true
      };
    case 'sending':
      return {
        text: t.sending,
        color: 'bg-yellow-500',
        pulse: false
      };
    case 'waiting':
      return {
        text: t.waitingResponse,
        color: 'bg-blue-500',
        pulse: true
      };
    case 'playing':
      return {
        text: t.playingResponse,
        color: 'bg-green-500',
        pulse: false
      };
    default:
      return {
        text: t.startConversation,
        color: 'bg-gray-400 hover:bg-gray-500',
        pulse: false
      };
  }
};

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  voiceState,
  onPress,
  disabled = false,
  isWaitingForClick = false,
  language
}) => {
  const t = getTranslations(language);
  const buttonState = getButtonState(voiceState.status, isWaitingForClick, t);
  const isDisabled = disabled || (voiceState.status !== 'idle' && !isWaitingForClick);

  return (
    <div className="flex flex-col items-center space-y-2 sm:space-y-3">
      <button
        onClick={onPress}
        disabled={isDisabled}
        className={cn(
          'w-24 h-24 sm:w-28 sm:h-28 rounded-full transition-all duration-200 relative',
          buttonState.color,
          buttonState.pulse && 'animate-slow-pulse',
          isDisabled && 'opacity-70 cursor-not-allowed'
        )}
      >
        <div style={{ position: 'absolute', top: '5%', left: '5%', width: '90%', height: '90%' }}>
          {/* Single large microphone icon */}
          <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9 2 6.5 4 6.5 7V12C6.5 15 9 17 12 17C15 17 17.5 15 17.5 12V7C17.5 4 15 2 12 2Z" fill="white" />
            <path d="M5 10V12C5 16.5 8 20 12 20C16 20 19 16.5 19 12V10" stroke="white" strokeWidth="2" />
            <path d="M12 20V23" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      </button>
      
      <p className="text-xs sm:text-sm font-medium text-gray-700 text-center">
        {buttonState.text}
      </p>
      
      {voiceState.error && (
        <p className="text-xs text-red-600 text-center max-w-xs">
          {voiceState.error}
        </p>
      )}
    </div>
  );
};
