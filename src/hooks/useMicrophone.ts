
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const useMicrophone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Super simple permission request - using just {audio: true} for maximum compatibility
  const requestPermission = useCallback(async () => {
    try {
      console.log('Requesting microphone permission with simple constraints');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

  // Cleanup function defined early so it can be called from various places
  const cleanup = useCallback(() => {
    console.log('Cleanup called, current recording state:', isRecording);
    
    try {
      // Stop the MediaRecorder if it exists
      if (mediaRecorderRef.current) {
        console.log('MediaRecorder exists, current state:', mediaRecorderRef.current.state);
        if (mediaRecorderRef.current.state === 'recording') {
          try {
            console.log('Stopping active media recorder');
            mediaRecorderRef.current.stop();
          } catch (e) {
            console.warn('Error stopping MediaRecorder:', e);
          }
        }
        mediaRecorderRef.current = null;
      }
      
      // Stop all tracks in the stream
      if (streamRef.current) {
        console.log('Stopping all audio tracks');
        streamRef.current.getTracks().forEach(track => {
          try {
            if (track.readyState === 'live') {
              track.stop();
            }
          } catch (e) {
            console.warn('Error stopping track:', e);
          }
        });
        streamRef.current = null;
      }
      
      // Reset recording state
      setIsRecording(false);
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Ensure recording state is reset even if there's an error
      setIsRecording(false);
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    // First ensure cleanup of any previous recording session
    cleanup();
    
    try {
      // Reset chunks array
      chunksRef.current = [];
      
      // Get microphone permission and stream
      console.log('Starting new recording session');
      const stream = await requestPermission();
      streamRef.current = stream;
      
      // Create a simple MediaRecorder with default settings
      console.log('Creating MediaRecorder with default settings');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event, data size:', event.data.size);
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // Set state before starting
      setIsRecording(true);
      
      // Start recording with frequent data collection
      console.log('Starting MediaRecorder');
      mediaRecorder.start(200); // Collect data every 200ms
      
      return mediaRecorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      cleanup(); // Clean up if start fails
      throw error;
    }
  }, [cleanup, requestPermission]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      console.log('Stop recording called, current state:', isRecording);
      
      // Create helper function to create audio blob from chunks
      const getAudioBlobFromChunks = () => {
        if (chunksRef.current.length === 0) {
          console.warn('No audio chunks available');
          return new Blob([], { type: 'audio/webm' });
        }
        
        // Use the recorder's mime type or fallback to a common type
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        console.log(`Creating blob from ${chunksRef.current.length} chunks with type ${mimeType}`);
        return new Blob(chunksRef.current, { type: mimeType });
      };
      
      // If there's no active recorder or it's not recording
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        console.warn('No active recording to stop or recorder in invalid state');
        
        // If we have any chunks, use them anyway (this happens often on mobile)
        if (chunksRef.current.length > 0) {
          console.log('Found audio chunks despite recorder state, using them');
          const audioBlob = getAudioBlobFromChunks();
          // We don't call full cleanup here because we need to keep the chunks
          setIsRecording(false);
          resolve(audioBlob);
          return;
        } else {
          console.warn('No audio chunks found, returning empty blob');
          const emptyBlob = new Blob([], { type: 'audio/webm' });
          setIsRecording(false);
          resolve(emptyBlob);
          return;
        }
      }
      
      // Set a safety timeout to resolve the promise if the stop event doesn't fire
      // This is critical for mobile browsers where events can be unreliable
      const timeoutId = setTimeout(() => {
        console.log('TIMEOUT: MediaRecorder.onstop did not fire within timeout, forcing completion');
        // Get whatever audio we have
        const audioBlob = getAudioBlobFromChunks();
        console.log(`Timeout: Created audio blob of size ${audioBlob.size} bytes`);
        cleanup();
        resolve(audioBlob);
      }, 1500); // 1.5 second timeout (shorter for mobile responsiveness)
      
      try {
        // Set up the stop event handler before trying to stop
        mediaRecorderRef.current.onstop = () => {
          console.log('MediaRecorder.onstop fired normally');
          clearTimeout(timeoutId);
          const audioBlob = getAudioBlobFromChunks();
          console.log(`Created audio blob of size ${audioBlob.size} bytes and type ${audioBlob.type}`);
          // Clean up after successfully getting the blob
          cleanup();
          resolve(audioBlob);
        };
        
        // Set up error handler
        mediaRecorderRef.current.onerror = (event) => {
          console.error('MediaRecorder error during stop:', event);
          clearTimeout(timeoutId);
          // Still try to create a blob from any chunks we have
          const audioBlob = getAudioBlobFromChunks();
          cleanup();
          if (audioBlob.size > 0) {
            console.log('Despite error, we have audio data to return');
            resolve(audioBlob);
          } else {
            const error = new Error('Recording failed with no data');
            reject(error);
          }
        };
        
        // Actually try to stop the recorder
        console.log('Attempting to stop MediaRecorder...');
        mediaRecorderRef.current.stop();
        console.log('Stop command sent to MediaRecorder');
      } catch (error) {
        // Handle any errors in the stopping process
        console.error('Exception while stopping MediaRecorder:', error);
        clearTimeout(timeoutId);
        
        // Attempt to salvage any audio we might have
        const audioBlob = getAudioBlobFromChunks();
        console.log(`After error, created blob of size ${audioBlob.size}`);
        cleanup();
        
        // If we have any audio at all, return it rather than failing
        if (audioBlob.size > 0) {
          resolve(audioBlob);
        } else {
          reject(error);
        }
      }
    });
  }, [cleanup, isRecording]);

  return {
    isRecording,
    hasPermission,
    startRecording,
    stopRecording,
    cleanup,
    requestPermission
  };
};
