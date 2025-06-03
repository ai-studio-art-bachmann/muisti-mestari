
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const useMicrophone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const requestPermission = useCallback(async () => {
    try {
      // Use proper audio constraints to ensure good voice quality
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
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

      // Try to use the most compatible audio format
      let mediaRecorder;
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/mp4'
        });
      } else {
        // Fall back to browser default
        mediaRecorder = new MediaRecorder(stream);
      }
      
      console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);
      
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
      
      // If there's no active recording, return an empty blob to allow the workflow to continue
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        console.warn('No active recording to stop or recorder in invalid state');
        // Create an empty audio blob to prevent errors downstream
        const emptyBlob = new Blob([], { type: 'audio/webm' });
        setIsRecording(false);
        resolve(emptyBlob);
        return;
      }

      // Set a timeout to ensure we don't get stuck waiting for onstop
      const timeoutId = setTimeout(() => {
        console.warn('MediaRecorder.onstop timed out after 3 seconds');
        // Cleanup manually since onstop didn't fire
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        // Create a blob from whatever chunks we have
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);
      }, 3000);

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder onstop fired, chunks:', chunksRef.current.length);
        clearTimeout(timeoutId);
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created, size:', audioBlob.size);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        clearTimeout(timeoutId);
        reject(event.error);
      };
      
      console.log('Calling mediaRecorder.stop()');
      mediaRecorder.stop();
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
