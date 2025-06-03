
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const useMicrophone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Helper to detect mobile browsers
  const isMobileBrowser = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const requestPermission = useCallback(async () => {
    try {
      // Use different audio constraints based on platform for better compatibility
      const audioConstraints = isMobileBrowser() 
        ? { audio: true } // Simpler constraints for mobile
        : { audio: { // More detailed for desktop
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
      
      console.log('Using audio constraints:', audioConstraints);
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      toast({
        title: "Mikrofonin käyttöoikeus vaaditaan",
        description: "Salli mikrofonin käyttö selaimen asetuksista.",
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await requestPermission();
      streamRef.current = stream;
      chunksRef.current = [];

          // Determine the best supported MIME type based on device and browser
      // Different browsers and platforms have different audio format support
      let mimeType = '';
      const supportedTypes = [
        'audio/webm', 
        'audio/webm;codecs=opus',
        'audio/mp4', 
        'audio/mp4;codecs=mp4a.40.5',
        'audio/mpeg', 
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      // Find the first supported type
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      let mediaRecorder;
      try {
        // Create recorder with the supported mime type if found
        if (mimeType) {
          console.log(`Using supported MIME type: ${mimeType}`);
          mediaRecorder = new MediaRecorder(stream, { mimeType });
        } else {
          // Fall back to browser default if no explicitly supported type found
          console.log('No explicitly supported MIME type found, using browser default');
          mediaRecorder = new MediaRecorder(stream);
        }
        
        console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
      } catch (err) {
        console.error('Error creating MediaRecorder with selected MIME type, using default:', err);
        // Final fallback - use default constructor with no options
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event, data size:', event.data.size);
        // Always collect data, even if it seems empty
        chunksRef.current.push(event.data);
      };
      
      // Start the media recorder with a reasonable timeslice
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      return mediaRecorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [requestPermission]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      console.log('Stop recording called');
      const mediaRecorder = mediaRecorderRef.current;
      
      // Helper function to create audio blob from chunks
      const getAudioBlobFromChunks = () => {
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        console.log(`Creating blob from ${chunksRef.current.length} chunks with type ${mimeType}`);
        return new Blob(chunksRef.current, { type: mimeType });
      };
      
      // If there's no active recording, return an empty blob to allow the workflow to continue
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        console.warn('No active recording to stop or recorder in invalid state');
        // Try to use any chunks we might have collected
        if (chunksRef.current.length > 0) {
          console.log('Found audio chunks despite recorder state, using them');
          const audioBlob = getAudioBlobFromChunks();
          setIsRecording(false);
          resolve(audioBlob);
        } else {
          // Create an empty audio blob to prevent errors downstream
          const emptyBlob = new Blob([], { type: 'audio/webm' });
          setIsRecording(false);
          resolve(emptyBlob);
        }
        return;
      }

      const timeoutId = setTimeout(() => {
        console.log('MediaRecorder.onstop did not fire within timeout, forcing cleanup');
        const audioBlob = getAudioBlobFromChunks();
        cleanup();
        resolve(audioBlob);
      }, 2000); // Reduced timeout for mobile

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder.onstop fired');
        clearTimeout(timeoutId);
        const audioBlob = getAudioBlobFromChunks();
        console.log(`Created audio blob of size ${audioBlob.size} bytes and type ${audioBlob.type}`);
        cleanup();
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error during stop:', error);
        clearTimeout(timeoutId);
        // Still try to create a blob from any chunks we have
        const audioBlob = getAudioBlobFromChunks();
        cleanup();
        if (audioBlob.size > 0) {
          console.log('Despite error, we have audio data to return');
          resolve(audioBlob);
        } else {
          reject(error);
        }
      };

      console.log('Stopping MediaRecorder...');
      try {
        mediaRecorder.stop();
      } catch (e) {
        console.error('Error stopping MediaRecorder, forcing cleanup', e);
        clearTimeout(timeoutId);
        const audioBlob = getAudioBlobFromChunks();
        cleanup();
        resolve(audioBlob);
      }
    });
  }, []);

  const cleanup = useCallback(() => {
    // Always log the current state for debugging
    console.log('Cleanup called, recorder state:', mediaRecorderRef.current?.state);
    
    try {
      // Always stop the MediaRecorder if it exists
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('Stopping active media recorder');
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
      }
      
      // Always stop all tracks in the stream
      if (streamRef.current) {
        console.log('Stopping all audio tracks');
        streamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        streamRef.current = null;
      }
      
      // Always reset recording state
      setIsRecording(false);
      chunksRef.current = [];
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Ensure recording state is reset even if there's an error
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    hasPermission,
    startRecording,
    stopRecording,
    cleanup,
    requestPermission
  };
};
