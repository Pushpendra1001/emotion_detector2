import * as tf from '@tensorflow/tfjs';

export class EmotionDetectionService {
  constructor() {
    this.isInitialized = true;
  }

  async detectEmotions(videoElement) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0);
      
      const frameData = canvas.toDataURL('image/jpeg');
      
      const response = await fetch('http://localhost:5005/api/emotion/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frame: frameData }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to detect emotions');
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error detecting emotions:', error);
      throw error;
    }
  }

  async startEmotionTracking(videoElement, onEmotionDetected) {
    return setInterval(async () => {
      try {
        const results = await this.detectEmotions(videoElement);
        if (results && results.length > 0) {
          onEmotionDetected(results[0]);
        }
      } catch (error) {
        console.error('Error tracking emotions:', error);
      }
    }, 200);
  }
}