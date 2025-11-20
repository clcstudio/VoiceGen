import React, { useState, useRef, useEffect } from 'react';
import { Mic, Music, Loader, CheckCircle, AlertCircle } from 'lucide-react';

// REAL API INTEGRATION!
const ELEVENLABS_API_KEY = ''; // Get FREE key at elevenlabs.io
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

function WorkingVoiceCloner() {
  const [step, setStep] = useState('record'); // record, training, generate, result
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [trainedVoiceId, setTrainedVoiceId] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const prompts = [
    "Hello, my name is [Your Name] and I love music",
    "I can't wait to create amazing songs with my voice",
    "This technology is absolutely incredible",
    "Music has always been my passion",
    "I'm so excited to hear what this sounds like"
  ];

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, { id: Date.now(), url, blob, duration: recordingTime }]);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // REAL FUNCTION: Train voice with ElevenLabs API
  const trainVoiceModel = async () => {
    if (recordings.length < 3) {
      setError('Please record at least 3 samples');
      return;
    }

    if (!ELEVENLABS_API_KEY) {
      setError('Please add your ElevenLabs API key at the top of the code');
      return;
    }

    setIsTraining(true);
    setStep('training');
    setError('');

    try {
      // Create FormData with recordings
      const formData = new FormData();
      formData.append('name', `Voice_${Date.now()}`);
      formData.append('description', 'AI cloned voice');

      // Add audio files
      recordings.forEach((recording, idx) => {
        const file = new File([recording.blob], `sample_${idx}.webm`, { type: 'audio/webm' });
        formData.append('files', file);
      });

      // Simulate progress
      setTrainingProgress(20);

      // Upload to ElevenLabs
      const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: formData
      });

      setTrainingProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Training failed');
      }

      const result = await response.json();
      setTrainingProgress(100);
      setTrainedVoiceId(result.voice_id);
      
      // Save to localStorage
      localStorage.setItem('trainedVoiceId', result.voice_id);

      setTimeout(() => {
        setIsTraining(false);
        setStep('generate');
      }, 1000);

    } catch (err) {
      console.error('Training error:', err);
      setError(`Training failed: ${err.message}. Make sure you have a valid ElevenLabs API key.`);
      setIsTraining(false);
      setStep('record');
    }
  };

  // REAL FUNCTION: Generate speech with trained voice
  const generateSpeech = async () => {
    if (!lyrics.trim()) {
      setError('Please enter lyrics');
      return;
    }

    const voiceId = trainedVoiceId || localStorage.getItem('trainedVoiceId');
    if (!voiceId) {
      setError('No trained voice found. Please train your voice first.');
      return;
    }

    setIsTraining(true);
    setError('');

    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: lyrics,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);
      setStep('result');

    } catch (err) {
      setError(`Generation failed: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  // Load saved voice ID on mount
  useEffect(() => {
    const savedVoiceId = localStorage.getItem('trainedVoiceId');
    if (savedVoiceId) {
      setTrainedVoiceId(savedVoiceId);
      setStep('generate');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-4">
            🎤 WORKING Voice Cloner
          </h1>
          <p className="text-gray-400 text-xl">Real AI-Powered Voice Deepfaking!</p>
          {!ELEVENLABS_API_KEY && (
            <div className="mt-4 bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 text-yellow-400">
              ⚠️ Add your ElevenLabs API key to make this work! Get it FREE at elevenlabs.io
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400 flex items-center gap-3">
            <AlertCircle />
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-center gap-4 mb-12">
          {['record', 'training', 'generate', 'result'].map((s, idx) => (
            <div key={s} className={`flex items-center gap-2 ${step === s ? 'text-cyan-400' : 'text-gray-600'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step === s ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-600'
              }`}>
                {idx + 1}
              </div>
              <span className="text-sm font-medium capitalize hidden md:block">{s}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Recording */}
        {step === 'record' && (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6">Step 1: Record Your Voice</h2>
            <p className="text-gray-400 mb-8">Record at least 3 samples (more = better quality)</p>

            {/* Current Prompt */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mb-8">
              <p className="text-lg text-white">📝 Read this: "{prompts[recordings.length % prompts.length]}"</p>
            </div>

            {/* Record Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 animate-pulse shadow-2xl shadow-red-500/50' 
                    : 'bg-cyan-500 hover:scale-110 shadow-2xl shadow-cyan-500/50'
                }`}
              >
                {isRecording ? (
                  <div className="w-12 h-12 bg-white rounded" />
                ) : (
                  <Mic size={48} className="text-white" />
                )}
              </button>
            </div>

            {isRecording && (
              <p className="text-center text-white text-2xl font-mono mb-8">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </p>
            )}

            {/* Recordings List */}
            <div className="space-y-3 mb-8">
              <h3 className="text-xl font-bold text-white">Your Recordings ({recordings.length})</h3>
              {recordings.map((rec, idx) => (
                <div key={rec.id} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-white">Recording {idx + 1}</span>
                  <audio controls src={rec.url} className="max-w-xs" />
                </div>
              ))}
            </div>

            {/* Train Button */}
            {recordings.length >= 3 && (
              <button
                onClick={trainVoiceModel}
                disabled={isTraining}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-6 rounded-xl text-xl font-bold hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
              >
                {isTraining ? 'Training...' : `Train Voice Model (${recordings.length} samples)`}
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Training */}
        {step === 'training' && (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-12 border border-gray-700 text-center">
            <Loader className="w-20 h-20 mx-auto mb-6 text-cyan-400 animate-spin" />
            <h2 className="text-3xl font-bold text-white mb-4">Training Your Voice Model...</h2>
            <p className="text-gray-400 mb-8">This may take 30-60 seconds</p>
            
            <div className="w-full bg-gray-700 rounded-full h-6 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full transition-all duration-500"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
            <p className="text-cyan-400 font-mono text-2xl">{trainingProgress}%</p>
          </div>
        )}

        {/* STEP 3: Generate */}
        {step === 'generate' && (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Step 2: Generate Song</h2>
              <CheckCircle className="text-green-400" size={32} />
            </div>
            <p className="text-gray-400 mb-8">✅ Voice model trained! Now enter your lyrics.</p>

            <div className="space-y-6">
              <div>
                <label className="text-white font-bold mb-3 block">Enter Lyrics:</label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full h-64 bg-black/40 border border-gray-700 rounded-xl p-6 text-white resize-none focus:border-cyan-500 focus:outline-none"
                  placeholder="Type your song lyrics here...&#10;&#10;Verse 1:&#10;I'm using AI to clone my voice&#10;Creating music is now my choice&#10;..."
                />
              </div>

              <button
                onClick={generateSpeech}
                disabled={isTraining || !lyrics.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-6 rounded-xl text-xl font-bold hover:scale-105 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isTraining ? (
                  <>
                    <Loader className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music />
                    Generate with My Voice
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === 'result' && generatedAudio && (
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-400" />
            <h2 className="text-3xl font-bold text-white mb-4">🎉 Your Song is Ready!</h2>
            <p className="text-gray-400 mb-8">Listen to your AI-generated vocals</p>

            <div className="bg-black/40 rounded-xl p-8 mb-8">
              <audio controls src={generatedAudio} className="w-full" autoPlay />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('generate')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl font-bold transition-all"
              >
                Generate Another
              </button>
              <a
                href={generatedAudio}
                download="my-ai-song.mp3"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:scale-105 transition-all text-center"
              >
                Download MP3
              </a>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-3">📖 How to Get Your FREE API Key:</h3>
          <ol className="text-gray-300 space-y-2 list-decimal list-inside">
            <li>Go to <a href="https://elevenlabs.io" target="_blank" rel="noopener" className="text-cyan-400 underline">elevenlabs.io</a></li>
            <li>Sign up (it's free!)</li>
            <li>Go to Profile → API Keys</li>
            <li>Copy your API key</li>
            <li>Paste it at the top of the code where it says <code className="bg-black/40 px-2 py-1 rounded">ELEVENLABS_API_KEY</code></li>
          </ol>
          <p className="text-gray-400 mt-4">Free tier gives you 10,000 characters/month (about 5-7 songs)</p>
        </div>
      </div>
    </div>
  );
}

export default WorkingVoiceCloner;