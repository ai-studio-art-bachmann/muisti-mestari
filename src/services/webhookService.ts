
export class WebhookService {
  private abortController: AbortController | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 20000; // 20 seconds timeout
  private readonly RETRY_DELAY_MS = 1000; // Initial retry delay

  // Check if we're on a mobile device
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Detect network connection quality
  private getNetworkInfo(): { type: string, downlink?: number, rtt?: number } {
    const connection = (navigator as any).connection;
    if (!connection) return { type: 'unknown' };
    
    return {
      type: connection.effectiveType || 'unknown',
      downlink: connection.downlink,
      rtt: connection.rtt
    };
  }

  async sendAudioToWebhook(audioBlob: Blob, webhookUrl: string): Promise<string> {
    // Cancel any previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    const controller = new AbortController();
    this.abortController = controller;

    // Log network connection info for debugging
    const networkInfo = this.getNetworkInfo();
    console.log('Network info:', networkInfo);

    // Prepare the audio blob - ensure correct MIME type is set
    let processedBlob = audioBlob;
    // If on mobile and blob isn't already webm, try to ensure it's a compatible format
    if (this.isMobile() && !audioBlob.type.includes('webm')) {
      processedBlob = new Blob([audioBlob], { type: 'audio/webm' });
    }

    console.log('Sending audio to webhook:', webhookUrl);
    console.log('Audio blob size:', processedBlob.size, 'bytes, type:', processedBlob.type);

    // Implement retry logic
    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.MAX_RETRIES) {
      try {
        if (retries > 0) {
          console.log(`Retry attempt ${retries} of ${this.MAX_RETRIES}...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * Math.pow(2, retries - 1)));
        }

        const formData = new FormData();
        formData.append('data0', processedBlob, 'speech.webm');

        // Set up timeout promise
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.TIMEOUT_MS);
        });

        // Set up fetch promise
        const fetchPromise = fetch(webhookUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'audio/mpeg,application/json,*/*'
          }
        });

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
        
        console.log('Webhook response status:', response.status);
        console.log('Webhook response headers:', response.headers);

        if (!response.ok) {
          throw new Error(`Palvelin vastasi virheellä: ${response.status} ${response.statusText}`);
        }

        // Clone the response before parsing to avoid locking the body
        const responseClone = response.clone();
        
        // Try to parse as JSON first
        let data;
        try {
          data = await response.json();
          console.log('Received JSON response:', data);
        } catch (error) {
          console.warn('Failed to parse response as JSON, trying text instead');
          // If JSON parsing fails, try to get as text
          try {
            const textData = await responseClone.text();
            console.log('Received text response:', textData);
            // Try to convert text to JSON
            try {
              data = JSON.parse(textData);
            } catch {
              // If all else fails, create a simple response object
              data = { textResponse: textData };
            }
          } catch (textError) {
            throw new Error(`Failed to parse response: ${error}`);
          }
        }
        
        // Handle the new response structure from n8n
        if (data.success && data.textResponse && data.audioResponse) {
          // Parse the textResponse which contains JSON
          let textData;
          try {
            textData = JSON.parse(data.textResponse);
          } catch (e) {
            console.warn('Could not parse textResponse as JSON, using as string');
            textData = { answer: data.textResponse };
          }
          
          // Check if audioResponse is a base64 string or binary data
          if (data.audioResponse && typeof data.audioResponse === 'string') {
            // Convert base64 audio to blob and create URL
            try {
              // Remove data URL prefix if present
              const base64Data = data.audioResponse.replace(/^data:audio\/[^;]+;base64,/, '');
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              console.log('Created audio URL from base64:', audioUrl);
              
              // Return the text answer but also store audio URL for playback
              return JSON.stringify({
                text: textData.answer || textData.response || 'Vastausta ei saatu.',
                audioUrl: audioUrl
              });
            } catch (error) {
              console.error('Error converting base64 audio:', error);
              return textData.answer || textData.response || 'Vastausta ei saatu.';
            }
          } else {
            // No audio or invalid audio format
            return textData.answer || textData.response || 'Vastausta ei saatu.';
          }
        } else {
          // Fallback for old response format
          return data.answer || data.response || 'Vastausta ei saatu.';
        }
        
        // If we reach here, we've successfully processed the response
        // Break out of retry loop
        break;
      } catch (error) {
        // If this is the last retry, rethrow the error
        if (retries === this.MAX_RETRIES) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Pyyntö keskeytetty');
          }
          console.error(`Webhook error on final retry (${retries}):`, error);
          
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Verkkoyhteydessä on ongelma. Tarkista internetyhteys.');
          }
          
          throw new Error('Palvelinyhteys epäonnistui');
        }
        
        // Otherwise, log the error and continue to the next retry
        console.warn(`Webhook error on retry ${retries}, will retry:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;
        continue;
      }
    }
    
    // If we've exhausted all retries and still have an error
    if (lastError) {
      throw lastError;
    }
    
    // Should never reach here, but just in case
    throw new Error('Unexpected error in webhook service');
  }

  cleanup() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
