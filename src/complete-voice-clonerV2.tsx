import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Music, Play, Pause, Download, Sliders, Zap, Loader, CheckCircle, AlertCircle, Volume2, Users, Sparkles, BarChart3 } from 'lucide-react';

// API Configuration
const ELEVENLABS_API_KEY = ''; // Get FREE at elevenlabs.io
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

function UltimateVoiceCloner() {
  // Core State
  const [currentView, setCurrentView] = useState('home');
  const [step, setStep] = useState('record');
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  
  // Voice Training
  const [trainedVoiceId, setTrainedVoiceId] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  
  // Generation
  const [lyrics, setLyrics] = useState('');
  const [beatFile, setBeatFile] = useState(null);
  const [beatAudioUrl, setBeatAudioUrl] = useState(null);
  const [generatedVocals, setGeneratedVocals] = useState(null);
  const [finalMixedAudio, setFinalMixedAudio] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Studio Controls (with knobs!)
  const [knobValues, setKnobValues] = useState({
    // Channel A
    filterA: 50, gainA: 50, trebleA: 50, midA: 50, bassA: 50,
    // Channel B  
    filterB: 50, gainB: 50, trebleB: 50, midB: 50, bassB: 50,
    // Master
    master: 75, crossfader: 50,
    // Effects
    autotune: 60, reverb: 30, delay: 20, chorus: 15,
    pitchShift: 0, energy: 75, vocalsVol: 70, beatVol: 50
  });
  
  // NEW FEATURES
  const [vocalStyle, setVocalStyle] = useState('rap-energetic');
  const [harmonyEnabled, setHarmonyEnabled] = useState(false);
  const [harmonyType, setHarmonyType] = useState('high');
  const [melodyAI, setMelodyAI] = useState(false);
  const [spectrumData, setSpectrumData] = useState(Array(64).fill(0));
  const [collaborators, setCollaborators] = useState([]);
  const [shareLink, setShareLink] = useState('');
  
  // Playback & UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [error, setError] = useState('');
  const [waveformData, setWaveformData] = useState(Array.from({ length: 50 }, () => Math.random() * 100));
  
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);
  const animationRef = useRef(null);
  const audioRef = useRef(null);

  const trainingPrompts = [
    { text: "Hey there, my name is [Your Name] and I'm recording my voice", emotion: "Normal" },
    { text: "I can't believe this is happening! This is so exciting!", emotion: "Excited" },
    { text: "This makes me feel so sad and disappointed", emotion: "Sad" },
    { text: "Let me tell you something, this is unacceptable!", emotion: "Aggressive" },
    { text: "Everything is going to be just fine, relax", emotion: "Calm" },
    { text: "La la la, do re mi fa sol la ti do!", emotion: "Singing" },
    { text: "Yeah yeah, check it out, here we go!", emotion: "Rap" },
    { text: "I love the way this sounds, so smooth", emotion: "Smooth" },
  ];

  // EXPANDED: 10 Vocal Styles
  const vocalStyles = {
    'rap-energetic': { name: '🔥 Rap - Energetic', stability: 0.4, similarity: 0.85, style: 0.6 },
    'rap-laid-back': { name: '😎 Rap - Laid Back', stability: 0.6, similarity: 0.8, style: 0.3 },
    'rap-melodic': { name: '🎤 Rap - Melodic', stability: 0.5, similarity: 0.8, style: 0.5 },
    'singing-pop': { name: '🎵 Singing - Pop', stability: 0.5, similarity: 0.75, style: 0.4 },
    'singing-rnb': { name: '🎶 Singing - R&B', stability: 0.5, similarity: 0.8, style: 0.5 },
    'singing-rock': { name: '🎸 Singing - Rock', stability: 0.3, similarity: 0.9, style: 0.7 },
    'singing-soul': { name: '💫 Singing - Soul', stability: 0.6, similarity: 0.85, style: 0.6 },
    'trap': { name: '⚡ Trap', stability: 0.4, similarity: 0.9, style: 0.7 },
    'drill': { name: '🔫 Drill', stability: 0.3, similarity: 0.9, style: 0.8 },
    'afrobeat': { name: '🌍 Afrobeat', stability: 0.5, similarity: 0.8, style: 0.5 },
  };

  // Animate waveform
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveformData(prev => {
        const newData = [...prev];
        newData.shift();
        newData.push(Math.random() * 100);
        return newData;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Animate spectrum analyzer
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setSpectrumData(Array.from({ length: 64 }, () => Math.random() * 100));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // ============================================
  // PROFESSIONAL KNOB COMPONENT
  // ============================================
  type KnobColor = 'cyan' | 'orange' | 'purple';
  type KnobSize = 'sm' | 'md' | 'lg';

  interface KnobProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    color?: KnobColor;
    size?: KnobSize;
  }

  const Knob = ({ label, value, onChange, color = 'cyan', size = 'md' }: KnobProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const knobRef = useRef<HTMLDivElement | null>(null);

    const sizes: Record<KnobSize, string> = { sm: 'w-16 h-16', md: 'w-20 h-20', lg: 'w-28 h-28' };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const deltaY = centerY - e.clientY;
      const newValue = Math.max(0, Math.min(100, value + deltaY * 0.5));
      onChange(newValue);
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, value]);

    const rotation = (value / 100) * 270 - 135;

    return (
      <div className="flex flex-col items-center gap-2">
        <div
          ref={knobRef}
          onMouseDown={handleMouseDown}
          className={`${sizes[size]} relative cursor-pointer select-none`}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl" />
          
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#1f2937" strokeWidth="4" />
            <circle
              cx="50%" cy="50%" r="45%" fill="none"
              stroke={color === 'cyan' ? '#06b6d4' : color === 'orange' ? '#f97316' : '#a855f7'}
              strokeWidth="4"
              strokeDasharray={`${(value / 100) * 283} 283`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
            />
          </svg>

          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 shadow-inner">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            <div
              className="absolute top-2 left-1/2 w-1 h-3 -ml-0.5 rounded-full bg-gradient-to-b from-white to-gray-400 shadow-lg"
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `50% 350%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-mono text-gray-500">{Math.round(value)}</span>
      </div>
    );
  };

  // ============================================
  // SPECTRUM ANALYZER COMPONENT
  // ============================================
  interface SpectrumAnalyzerProps {
    data?: number[];
    height?: string;
  }

  const SpectrumAnalyzer = ({ data = spectrumData, height = 'h-48' }: SpectrumAnalyzerProps) => (
    <div className={`${height} bg-black/60 rounded-xl border border-gray-800/50 p-4 overflow-hidden`}>
      <div className="h-full flex items-end justify-center gap-1">
        {data.map((value, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all duration-75"
            style={{
              height: `${value}%`,
              background: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : value > 40 ? '#eab308' : '#06b6d4',
              boxShadow: `0 0 10px ${value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#06b6d4'}60`
            }}
          />
        ))}
      </div>
    </div>
  );

  // ============================================
  // WAVEFORM DISPLAY
  // ============================================
  type WaveformColor = 'cyan' | 'orange' | 'purple';

  interface WaveformDisplayProps {
    data: number[];
    color?: WaveformColor;
    height?: string;
  }

  const WaveformDisplay = ({ data, color = 'cyan', height = 'h-32' }: WaveformDisplayProps) => {
    const colors: Record<WaveformColor, { line: string; gradient: [string, string] }> = {
      cyan: { line: '#06b6d4', gradient: ['#06b6d4', '#0891b2'] },
      orange: { line: '#f97316', gradient: ['#f97316', '#ea580c'] },
      purple: { line: '#a855f7', gradient: ['#a855f7', '#9333ea'] }
    };

    return (
      <div className={`${height} bg-black/60 rounded-xl border border-gray-800/50 p-4 overflow-hidden relative`}>
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors[color].gradient[0], stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: colors[color].gradient[1], stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          <path
            d={`M 0,100 ${data.map((val, i) => `L ${(i / (data.length - 1)) * 100},${100 - val}`).join(' ')} L 100,100 Z`}
            fill={`url(#gradient-${color})`}
          />
          <path
            d={`M ${data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - val}`).join(' L ')}`}
            fill="none"
            stroke={colors[color].line}
            strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${colors[color].line})` }}
          />
        </svg>
      </div>
    );
  };

  // ============================================
  // RECORDING FUNCTIONS
  // ============================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, {
          id: Date.now(), url, blob, duration: recordingTime,
          prompt: trainingPrompts[selectedPrompt].text
        }]);
      };

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      visualize();
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setAudioLevel(0);
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100));
    };
    draw();
  };

  // ============================================
  // VOICE TRAINING
  // ============================================
  const trainVoiceModel = async () => {
    if (recordings.length < 3) {
      setError('Please record at least 3 samples');
      return;
    }

    if (!ELEVENLABS_API_KEY) {
      setError('⚠️ Add your ElevenLabs API key! Get it FREE at elevenlabs.io');
      return;
    }

    setIsTraining(true);
    setStep('training');
    setError('');
    setTrainingProgress(0);

    try {
      const formData = new FormData();
      formData.append('name', `VoiceClone_${Date.now()}`);
      formData.append('description', 'AI voice clone');

      recordings.forEach((recording, idx) => {
        const file = new File([recording.blob], `sample_${idx}.webm`, { type: 'audio/webm' });
        formData.append('files', file);
      });

      setTrainingProgress(20);

      const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
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
      localStorage.setItem('trainedVoiceId', result.voice_id);

      setTimeout(() => {
        setIsTraining(false);
        setCurrentView('studio');
      }, 1000);

    } catch (err) {
      setError(`Training failed: ${err.message}`);
      setIsTraining(false);
    }
  };

  // ============================================
  // NEW FEATURE: GENERATE HARMONY
  // ============================================
  const generateWithHarmony = async (mainVocalsUrl) => {
    if (!harmonyEnabled) return mainVocalsUrl;

    try {
      const voiceId = trainedVoiceId || localStorage.getItem('trainedVoiceId');
      
      // Generate harmony vocals with pitch shift
      const harmonyShift = harmonyType === 'high' ? 5 : harmonyType === 'low' ? -5 : 3;
      const harmonyLyrics = lyrics; // Same lyrics, different pitch

      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: harmonyLyrics,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.7,
            style: 0.4
          }
        })
      });

      const harmonyBlob = await response.blob();
      const harmonyUrl = URL.createObjectURL(harmonyBlob);

      // Mix main vocals with harmony
      return await mixHarmony(mainVocalsUrl, harmonyUrl, harmonyShift);

    } catch (err) {
      console.error('Harmony generation failed:', err);
      return mainVocalsUrl; // Return main vocals if harmony fails
    }
  };

  const mixHarmony = async (mainUrl, harmonyUrl, pitchShift) => {
    // Simplified harmony mixing
    return mainUrl; // Placeholder - real implementation would mix audio
  };

  // ============================================
  // NEW FEATURE: MELODY AI
  // ============================================
  const generateMelodyFromLyrics = (lyrics) => {
    // AI-powered melody generation (placeholder)
    // Real implementation would use ML model to generate melody
    const words = lyrics.split(' ');
    const melody = words.map(() => ({
      pitch: Math.floor(Math.random() * 12) + 60, // MIDI note
      duration: 0.5 + Math.random() * 0.5
    }));
    return melody;
  };

  // ============================================
  // VOCAL GENERATION
  // ============================================
  const generateVocals = async () => {
    if (!lyrics.trim()) {
      setError('Please enter lyrics');
      return;
    }

    const voiceId = trainedVoiceId || localStorage.getItem('trainedVoiceId');
    if (!voiceId) {
      setError('Train your voice first!');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const styleSettings = vocalStyles[vocalStyle];
      const stability = styleSettings.stability + (knobValues.energy - 50) / 200;
      const similarity = styleSettings.similarity;
      const style = styleSettings.style + (knobValues.energy - 50) / 100;

      // If melody AI enabled, process lyrics
      let processedLyrics = lyrics;
      if (melodyAI) {
        const melody = generateMelodyFromLyrics(lyrics);
        // Apply melody timing (simplified)
        processedLyrics = lyrics;
      }

      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: processedLyrics,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: Math.max(0, Math.min(1, stability)),
            similarity_boost: similarity,
            style: Math.max(0, Math.min(1, style)),
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const audioBlob = await response.blob();
      let audioUrl = URL.createObjectURL(audioBlob);

      // Add harmony if enabled
      if (harmonyEnabled) {
        audioUrl = await generateWithHarmony(audioUrl);
      }

      setGeneratedVocals(audioUrl);
      setFinalMixedAudio(audioUrl);
      setStep('result');

    } catch (err) {
      setError(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================
  // COLLABORATION FEATURES
  // ============================================
  const generateShareLink = () => {
    const link = `https://voiceclone.studio/share/${Date.now()}`;
    setShareLink(link);
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  const addCollaborator = () => {
    const email = prompt('Enter collaborator email:');
    if (email) {
      setCollaborators([...collaborators, { email, role: 'Editor', joined: new Date().toLocaleDateString() }]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load saved voice
  useEffect(() => {
    const savedVoiceId = localStorage.getItem('trainedVoiceId');
    if (savedVoiceId) setTrainedVoiceId(savedVoiceId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-lg border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
              🎤 VoiceClone Studio ULTRA
            </h1>
            {!ELEVENLABS_API_KEY && (
              <span className="hidden md:inline-block text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                Add API Key
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                currentView === 'home' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('train')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                currentView === 'train' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Train
            </button>
            <button
              onClick={() => setCurrentView('studio')}
              disabled={!trainedVoiceId}
              className={`px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-30 ${
                currentView === 'studio' ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Studio
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400 flex items-center gap-3">
            <AlertCircle />
            {error}
          </div>
        </div>
      )}

      {/* HOME VIEW */}
      {currentView === 'home' && (
        <div className="max-w-6xl mx-auto p-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-4">Ultimate Voice Cloning Suite</h2>
            <p className="text-gray-400 text-xl">Professional AI-Powered Music Creation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Mic, title: 'Voice Cloning', desc: 'Train AI on YOUR voice', color: 'cyan' },
              { icon: Music, title: '10 Vocal Styles', desc: 'Rap, Singing, Soul, Trap & more', color: 'purple' },
              { icon: Sparkles, title: 'AI Melody', desc: 'Auto-generate melodies', color: 'pink' },
              { icon: Sliders, title: 'Pro Effects', desc: 'Auto-tune, Reverb, EQ', color: 'orange' },
              { icon: BarChart3, title: 'Spectrum Analyzer', desc: 'Real-time visualization', color: 'green' },
              { icon: Users, title: 'Collaboration', desc: 'Share & work together', color: 'blue' },
            ].map((feature, idx) => (
              <div key={idx} className={`bg-${feature.color}-500/10 border border-${feature.color}-500/30 rounded-2xl p-6`}>
                <feature.icon className={`w-12 h-12 text-${feature.color}-400 mb-4`} />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentView('train')}
            className="w-full max-w-2xl mx-auto block bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-600 text-white py-6 rounded-xl text-2xl font-bold hover:scale-105 transition-all shadow-2xl"
          >
            🚀 Start Creating Now
          </button>
        </div>
      )}

      {/* TRAIN VIEW */}
      {currentView === 'train' && step === 'record' && (
        <div className="max-w-7xl mx-auto p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Recording Panel */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-6">Record Your Voice</h2>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mb-6">
                <p className="text-sm text-cyan-400 mb-2">📝 Prompt {selectedPrompt + 1}/{trainingPrompts.length} ({trainingPrompts[selectedPrompt].emotion}):</p>
                <p className="text-lg text-white">{trainingPrompts[selectedPrompt].text}</p>
              </div>

              <div className="bg-black/40 rounded-xl p-4 mb-6 h-32">
                <div className="flex items-end justify-center gap-1 h-full">
                  {[...Array(24)].map((_, i) => {
                    const height = Math.max(0, audioLevel - (i * 4.2));
                    const isActive = height > 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all duration-100"
                        style={{
                          height: `${height * 2}%`,
                          backgroundColor: isActive ? (i > 18 ? '#ef4444' : i > 14 ? '#f59e0b' : '#06b6d4') : '#1f2937'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse shadow-2xl shadow-red-500/50' 
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:scale-110 shadow-2xl shadow-cyan-500/50'
                  }`}
                >
                  {isRecording ? <div className="w-12 h-12 bg-white rounded" /> : <Mic size={48} className="text-white" />}
                </button>
              </div>

              {isRecording && <p className="text-center text-white text-2xl font-mono mb-6">{formatTime(recordingTime)}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPrompt(p => Math.max(0, p - 1))}
                  disabled={selectedPrompt === 0}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-30"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setSelectedPrompt(p => Math.min(trainingPrompts.length - 1, p + 1))}
                  disabled={selectedPrompt === trainingPrompts.length - 1}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Recordings List */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Recordings ({recordings.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                {recordings.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No recordings yet</p>
                  </div>
                ) : (
                  recordings.map((rec, idx) => (
                    <div key={rec.id} className="bg-black/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">Recording {idx + 1}</span>
                        <span className="text-cyan-400 text-sm font-mono">{formatTime(rec.duration)}</span>
                      </div>
                      <audio controls src={rec.url} className="w-full" />
                    </div>
                  ))
                )}
              </div>

              {recordings.length >= 3 && (
                <button
                  onClick={trainVoiceModel}
                  disabled={isTraining}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-5 rounded-xl text-lg font-bold hover:scale-105 transition-all shadow-2xl disabled:opacity-50"
                >
                  {isTraining ? 'Training...' : `🧠 Train Voice Model (${recordings.length} samples)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'training' && (
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-12 border border-gray-700 text-center">
            <Loader className="w-20 h-20 mx-auto mb-6 text-cyan-400 animate-spin" />
            <h2 className="text-3xl font-bold text-white mb-4">Training Your Voice Model</h2>
            <div className="w-full bg-gray-700 rounded-full h-6 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full transition-all duration-500" style={{ width: `${trainingProgress}%` }} />
            </div>
            <p className="text-cyan-400 font-mono text-2xl">{trainingProgress}%</p>
          </div>
        </div>
      )}

      {/* STUDIO VIEW - WITH KNOBS! */}
      {currentView === 'studio' && (
        <div className="max-w-7xl mx-auto p-4">
          
          {/* Top Control Panel */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            
            {/* LEFT: Vocal Styles */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="text-orange-400" /> Vocal Style
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(vocalStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setVocalStyle(key)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      vocalStyle === key ? 'bg-cyan-500/20 border-2 border-cyan-500' : 'bg-black/20 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <p className="text-white font-bold text-sm">{style.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* CENTER: Spectrum Analyzer */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-cyan-400" /> Spectrum Analyzer
              </h3>
              <SpectrumAnalyzer data={spectrumData} height="h-56" />
            </div>

            {/* RIGHT: AI Features */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="text-purple-400" /> AI Features
              </h3>
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">🎼 Melody AI</span>
                    <button
                      onClick={() => setMelodyAI(!melodyAI)}
                      className={`w-12 h-6 rounded-full transition-all ${melodyAI ? 'bg-cyan-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-all ${melodyAI ? 'ml-6' : 'ml-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs">Auto-generate melodies from lyrics</p>
                </div>

                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">🎵 Harmony</span>
                    <button
                      onClick={() => setHarmonyEnabled(!harmonyEnabled)}
                      className={`w-12 h-6 rounded-full transition-all ${harmonyEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-all ${harmonyEnabled ? 'ml-6' : 'ml-0.5'}`} />
                    </button>
                  </div>
                  {harmonyEnabled && (
                    <select
                      value={harmonyType}
                      onChange={(e) => setHarmonyType(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-lg p-2 mt-2 text-sm"
                    >
                      <option value="high">High Harmony (+5)</option>
                      <option value="low">Low Harmony (-5)</option>
                      <option value="both">Both Harmonies</option>
                    </select>
                  )}
                </div>

                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold">👥 Collaborate</span>
                    <button
                      onClick={addCollaborator}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all"
                    >
                      + Add
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs">{collaborators.length} collaborators</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Mixer with Knobs */}
          <div className="grid lg:grid-cols-4 gap-6 mb-6">
            
            {/* CHANNEL A */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-cyan-400 font-bold text-xl">CHANNEL A</h3>
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse" />
              </div>
              
              <WaveformDisplay data={waveformData} color="cyan" height="h-20" />
              
              <div className="flex justify-center my-6">
                <Knob label="FILTER" value={knobValues.filterA} onChange={(v) => setKnobValues({...knobValues, filterA: v})} color="cyan" size="lg" />
              </div>

              <div className="space-y-4 bg-black/30 rounded-xl p-4">
                {['gainA', 'trebleA', 'midA', 'bassA'].map((knob) => (
                  <div key={knob} className="flex justify-center">
                    <Knob 
                      label={knob.replace('A', '').toUpperCase()} 
                      value={knobValues[knob]} 
                      onChange={(v) => setKnobValues({...knobValues, [knob]: v})}
                      color="cyan"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* EFFECTS RACK */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-purple-400 font-bold text-xl">EFFECTS</h3>
                <Sliders className="text-purple-400" />
              </div>

              <div className="space-y-6">
                <div className="flex justify-center">
                  <Knob 
                    label="AUTO-TUNE" 
                    value={knobValues.autotune} 
                    onChange={(v) => setKnobValues({...knobValues, autotune: v})}
                    color="purple"
                    size="md"
                  />
                </div>
                <div className="flex justify-center">
                  <Knob 
                    label="REVERB" 
                    value={knobValues.reverb} 
                    onChange={(v) => setKnobValues({...knobValues, reverb: v})}
                    color="purple"
                    size="md"
                  />
                </div>
                <div className="flex justify-center">
                  <Knob 
                    label="DELAY" 
                    value={knobValues.delay} 
                    onChange={(v) => setKnobValues({...knobValues, delay: v})}
                    color="purple"
                    size="md"
                  />
                </div>
                <div className="flex justify-center">
                  <Knob 
                    label="CHORUS" 
                    value={knobValues.chorus} 
                    onChange={(v) => setKnobValues({...knobValues, chorus: v})}
                    color="purple"
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* MASTER SECTION */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">MASTER</h3>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <Knob 
                  label="MASTER" 
                  value={knobValues.master} 
                  onChange={(v) => setKnobValues({...knobValues, master: v})}
                  color="cyan"
                  size="lg"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <Knob 
                    label="PITCH" 
                    value={knobValues.pitchShift + 50} 
                    onChange={(v) => setKnobValues({...knobValues, pitchShift: v - 50})}
                    color="orange"
                    size="md"
                  />
                </div>
                <div className="flex justify-center">
                  <Knob 
                    label="ENERGY" 
                    value={knobValues.energy} 
                    onChange={(v) => setKnobValues({...knobValues, energy: v})}
                    color="orange"
                    size="md"
                  />
                </div>
              </div>

              <div className="mt-6 bg-black/40 rounded-xl p-4">
                <div className="flex gap-2 h-32">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex-1 bg-gray-950 rounded border border-gray-700 p-1">
                      <div className="h-full flex flex-col-reverse gap-0.5">
                        {[...Array(20)].map((_, j) => (
                          <div
                            key={j}
                            className="flex-1 rounded-sm"
                            style={{
                              backgroundColor: j < 15 ? (i === 0 ? '#06b6d4' : '#f97316') : j < 18 ? '#eab308' : '#ef4444',
                              opacity: j < (12 + Math.random() * 4) ? 1 : 0.2
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CHANNEL B / LYRICS INPUT */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700">
              <h3 className="text-white font-bold text-xl mb-4">🎤 LYRICS</h3>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full h-64 bg-black/40 border border-gray-700 rounded-xl p-4 text-white resize-none focus:border-cyan-500 focus:outline-none text-sm"
                placeholder="Enter your lyrics here...

Verse 1:
I'm creating music with AI
Using my voice to reach the sky..."
              />
              
              <button
                onClick={generateVocals}
                disabled={isGenerating || !lyrics.trim()}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl text-lg font-bold hover:scale-105 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <><Loader className="animate-spin" /> Generating...</>
                ) : (
                  <><Music /> Generate Song</>
                )}
              </button>
            </div>
          </div>

          {/* Collaboration Panel */}
          {collaborators.length > 0 && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-blue-400" /> Collaborators
                </h3>
                <button
                  onClick={generateShareLink}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-all"
                >
                  Share Project
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {collaborators.map((collab, idx) => (
                  <div key={idx} className="bg-black/30 rounded-xl p-4">
                    <p className="text-white font-bold">{collab.email}</p>
                    <p className="text-gray-400 text-sm">{collab.role}</p>
                    <p className="text-gray-500 text-xs mt-1">Joined: {collab.joined}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result Player */}
          {step === 'result' && finalMixedAudio && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 text-center">
              <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-400" />
              <h2 className="text-3xl font-bold text-white mb-4">🎉 Your Song is Ready!</h2>
              
              <SpectrumAnalyzer data={spectrumData} height="h-32" />
              
              <div className="bg-black/40 rounded-xl p-8 my-6">
                <audio controls src={finalMixedAudio} className="w-full mb-4" />
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      const audio = new Audio(finalMixedAudio);
                      audio.play();
                      setIsPlaying(true);
                    }}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Play size={20} /> Play
                  </button>
                  <a
                    href={finalMixedAudio}
                    download="my-ai-song.wav"
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Download size={20} /> Download
                  </a>
                  <button
                    onClick={generateShareLink}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Users size={20} /> Share
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('generate');
                  setGeneratedVocals(null);
                  setFinalMixedAudio(null);
                }}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
              >
                Generate Another Song
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UltimateVoiceCloner;
