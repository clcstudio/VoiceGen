// Voice Cloning API Integration
// This connects your beautiful UI to REAL voice cloning!

// API Configuration
const ELEVENLABS_API_KEY = 'YOUR_API_KEY_HERE'; // Get free at elevenlabs.io
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Alternative: Replica Studios (has free tier)
const REPLICA_API_KEY = 'YOUR_REPLICA_KEY';
const REPLICA_API_URL = 'https://api.replicastudios.com/v1';

// Voice Cloning Service
class VoiceCloner {
  constructor(apiKey, provider = 'elevenlabs') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.baseURL = provider === 'elevenlabs' ? ELEVENLABS_API_URL : REPLICA_API_URL;
  }

  // Step 1: Upload voice samples and create voice model
  async trainVoice(recordings, voiceName, userId) {
    try {
      console.log(`🎤 Training voice model for ${voiceName}...`);
      
      // Convert recordings to proper format
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('description', `AI voice clone for user ${userId}`);
      
      // Add all recording files
      for (let i = 0; i < recordings.length; i++) {
        const recording = recordings[i];
        // Convert blob to file
        const file = new File([recording.blob], `sample_${i}.webm`, { type: 'audio/webm' });
        formData.append('files', file);
      }

      // Upload to ElevenLabs
      const response = await fetch(`${this.baseURL}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Training failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Voice model created!', result);
      
      return {
        success: true,
        voiceId: result.voice_id,
        message: 'Voice cloned successfully!'
      };

    } catch (error) {
      console.error('❌ Training error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Step 2: Generate speech with cloned voice
  async generateSpeech(voiceId, text, options = {}) {
    try {
      console.log(`🎵 Generating speech with voice ${voiceId}...`);

      const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: options.model || 'eleven_multilingual_v2',
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarity || 0.75,
            style: options.style || 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      // Get audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('✅ Speech generated!');
      
      return {
        success: true,
        audioUrl: audioUrl,
        audioBlob: audioBlob
      };

    } catch (error) {
      console.error('❌ Generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Step 3: Get all trained voices for a user
  async getVoices() {
    try {
      const response = await fetch(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  // Step 4: Delete a voice model
  async deleteVoice(voiceId) {
    try {
      await fetch(`${this.baseURL}/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting voice:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in React app
export default VoiceCloner;

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Train a voice model
async function exampleTrainVoice(recordings) {
  const cloner = new VoiceCloner('your-api-key-here');
  
  const result = await cloner.trainVoice(
    recordings,
    'My Voice',
    'user-123'
  );
  
  if (result.success) {
    console.log('Voice ID:', result.voiceId);
    // Save this voiceId to database for later use
    localStorage.setItem('myVoiceId', result.voiceId);
  }
}

// Example 2: Generate song with trained voice
async function exampleGenerateSong(lyrics) {
  const cloner = new VoiceCloner('your-api-key-here');
  const voiceId = localStorage.getItem('myVoiceId');
  
  const result = await cloner.generateSpeech(
    voiceId,
    lyrics,
    {
      stability: 0.6,
      similarity: 0.8,
      style: 0.5 // More expressive
    }
  );
  
  if (result.success) {
    // Play the generated audio
    const audio = new Audio(result.audioUrl);
    audio.play();
  }
}

// ============================================
// ALTERNATIVE: Hugging Face (100% FREE!)
// ============================================

class HuggingFaceVoiceCloner {
  constructor(apiKey) {
    this.apiKey = apiKey; // Free API key from huggingface.co
    this.modelId = 'facebook/mms-tts-eng'; // Free TTS model
  }

  async generateSpeech(text) {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }
}

// ============================================
// PRICING COMPARISON
// ============================================

/*
ELEVENLABS (Best Quality):
✅ Professional voice cloning
✅ $1 first month, then $5/month
✅ 10,000 characters/month (about 7 songs)
✅ Best for: Production use

REPLICA STUDIOS:
✅ Good quality
✅ Free tier: 30 mins/month
✅ $20/month for more
✅ Best for: Testing

PLAY.HT:
✅ Voice cloning available
✅ Free tier: 2,500 words/month
✅ $19/month paid tier
✅ Best for: Budget option

HUGGING FACE (FREE!):
✅ 100% Free forever
❌ No custom voice cloning (uses preset voices)
❌ Lower quality than paid options
✅ Best for: MVP/Testing

MY RECOMMENDATION:
1. Start with HUGGING FACE (free) to test everything works
2. Upgrade to ELEVENLABS ($5/month) for real voice cloning
3. Scale to custom RVC later if you get traction
*/
