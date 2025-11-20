import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Music, Play, SkipBack, SkipForward, Sliders, Power } from 'lucide-react';

const VoiceCloneStudio = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [micPermission, setMicPermission] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [knobValues, setKnobValues] = useState({
    filterA: 50,
    gainA: 50,
    trebleA: 50,
    midA: 50,
    bassA: 50,
    filterB: 50,
    gainB: 50,
    trebleB: 50,
    midB: 50,
    bassB: 50,
    master: 75
  });
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);

  const trainingPrompts = [
    { id: 1, text: "Hey there, my name is [Your Name] and I'm recording my voice", category: "Normal" },
    { id: 2, text: "I can't believe this is happening right now!", category: "Excited" },
    { id: 3, text: "This makes me feel so sad and disappointed", category: "Sad" },
    { id: 4, text: "Let me tell you something, this is unacceptable", category: "Aggressive" },
    { id: 5, text: "Everything is going to be just fine, don't worry", category: "Calm" },
    { id: 6, text: "La la la, do re mi fa sol la ti do", category: "Singing" },
  ];

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      setMicPermission('granted');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      setMicPermission('denied');
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, {
          id: Date.now(), url, blob, duration: recordingTime,
          prompt: trainingPrompts[selectedPrompt].text,
          category: trainingPrompts[selectedPrompt].category
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

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      visualize();
    } catch (err) {
      alert('Could not start recording. Please ensure microphone permissions are enabled.');
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const goToTraining = async () => {
    setCurrentView('train');
    if (micPermission !== 'granted') await requestMicPermission();
  };

  const updateKnob = (knobId, value) => {
    setKnobValues(prev => ({ ...prev, [knobId]: value }));
  };

  // Professional Knob Component
  const Knob = ({ label, value, onChange, color = 'cyan', size = 'md' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const knobRef = useRef(null);

    const sizes = {
      sm: 'w-16 h-16',
      md: 'w-20 h-20',
      lg: 'w-28 h-28'
    };

    const colorClasses = {
      cyan: 'from-cyan-400 to-cyan-600',
      orange: 'from-orange-400 to-orange-600',
      purple: 'from-purple-400 to-purple-600',
      green: 'from-green-400 to-green-600',
      red: 'from-red-400 to-red-600'
    };

    const handleMouseDown = (e) => {
      setIsDragging(true);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const deltaY = centerY - e.clientY;
      const sensitivity = 0.5;
      const newValue = Math.max(0, Math.min(100, value + deltaY * sensitivity));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

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
          style={{ touchAction: 'none' }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl" />
          
          {/* Value indicator ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#1f2937"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeDasharray={`${(value / 100) * 283} 283`}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
              className={`text-${color}-400`}
            />
            <defs>
              <linearGradient id="gradient" gradientTransform="rotate(90)">
                <stop offset="0%" className={`stop-${color}-400`} />
                <stop offset="100%" className={`stop-${color}-600`} />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner knob */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 shadow-inner">
            {/* Glossy highlight */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            
            {/* Position indicator */}
            <div
              className="absolute top-2 left-1/2 w-1 h-3 -ml-0.5 rounded-full bg-gradient-to-b from-white to-gray-400 shadow-lg"
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `50% ${size === 'lg' ? '450%' : '350%'}` }}
            />
          </div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-gray-900 shadow-inner" />
        </div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-mono text-gray-500">{Math.round(value)}</span>
      </div>
    );
  };

  // Vertical Fader Component
  const Fader = ({ label, value, onChange, color = 'cyan', height = 'h-48' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const faderRef = useRef(null);

    const handleMouseDown = () => setIsDragging(true);

    const handleMouseMove = (e) => {
      if (!isDragging || !faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const y = Math.max(0, Math.min(rect.height, rect.bottom - e.clientY));
      const newValue = (y / rect.height) * 100;
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
    }, [isDragging]);

    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-gray-400 uppercase">{label}</span>
        <div
          ref={faderRef}
          onMouseDown={handleMouseDown}
          className={`relative w-12 ${height} bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-inner cursor-pointer`}
        >
          {/* Track background */}
          <div className="absolute inset-2 bg-black/50 rounded" />
          
          {/* Value fill */}
          <div
            className={`absolute inset-x-2 bottom-2 rounded bg-gradient-to-t ${
              color === 'cyan' ? 'from-cyan-500 to-cyan-400' :
              color === 'orange' ? 'from-orange-500 to-orange-400' :
              'from-white to-gray-300'
            } transition-all`}
            style={{
              height: `${value}%`,
              boxShadow: `0 0 20px ${color === 'cyan' ? '#06b6d4' : color === 'orange' ? '#f97316' : '#ffffff'}40`
            }}
          />
          
          {/* Handle */}
          <div
            className="absolute inset-x-0 w-full h-6 bg-gradient-to-b from-gray-500 via-gray-400 to-gray-500 shadow-lg rounded transition-all"
            style={{
              bottom: `calc(${value}% - 12px)`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </div>

          {/* Scale marks */}
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              className="absolute left-0 w-1 h-px bg-gray-600"
              style={{ bottom: `${mark}%` }}
            />
          ))}
        </div>
        <span className="text-xs font-mono text-gray-500">{Math.round(value)}</span>
      </div>
    );
  };

  // VU Meter Component
  const VUMeter = ({ level, color = 'cyan' }) => {
    const segments = 20;
    const activeSegments = Math.floor((level / 100) * segments);

    return (
      <div className="flex-1 bg-gradient-to-b from-gray-900 to-black rounded-lg p-2 shadow-inner">
        <div className="h-full flex flex-col-reverse gap-1">
          {Array.from({ length: segments }).map((_, i) => {
            const isActive = i < activeSegments;
            const segmentColor = 
              i < 12 ? (color === 'cyan' ? '#06b6d4' : '#f97316') :
              i < 16 ? '#eab308' :
              '#ef4444';

            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-75"
                style={{
                  backgroundColor: isActive ? segmentColor : '#1f2937',
                  boxShadow: isActive ? `0 0 8px ${segmentColor}` : 'none',
                  opacity: isActive ? 1 : 0.3
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Home View */}
      {currentView === 'home' && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              VoiceClone Studio
            </h1>
            <p className="text-gray-400 text-xl">Professional AI Voice Training & Generation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {[
              { icon: Mic, title: 'Train Voice', desc: 'Record samples to clone your voice', color: 'cyan', onClick: goToTraining },
              { icon: Music, title: 'Generate Song', desc: 'Create music with your AI voice', color: 'blue', onClick: () => setCurrentView('generate') },
              { icon: Sliders, title: 'Mix & Master', desc: 'Professional audio effects', color: 'purple', onClick: () => setCurrentView('studio') }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-10 rounded-3xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20 hover:scale-105"
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <item.icon className={`w-16 h-16 mx-auto mb-6 text-${item.color}-400 group-hover:scale-110 transition-transform drop-shadow-lg`} />
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Training View */}
      {currentView === 'train' && (
        <div className="flex flex-col min-h-screen p-8 gap-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-cyan-400 transition-colors text-lg">
              ← Back
            </button>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Voice Training
            </h2>
            <div className="text-cyan-400 font-mono text-lg">{recordings.length}/20</div>
          </div>

          {micPermission === 'denied' && (
            <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6 text-red-400 backdrop-blur-sm">
              <strong className="text-lg">🎤 Microphone Blocked!</strong>
              <p className="mt-2">Please enable microphone permissions in your browser settings.</p>
              <button onClick={requestMicPermission} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-bold transition-all">
                Try Again
              </button>
            </div>
          )}

          {micPermission === 'granted' && (
            <div className="bg-green-500/10 border-2 border-green-500/50 rounded-2xl p-4 text-green-400 backdrop-blur-sm">
              ✓ Microphone ready! Click the record button to start.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recording Interface */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 space-y-8 shadow-2xl">
              <div className="text-center space-y-4">
                <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Read this prompt:</div>
                <div className="bg-black/30 rounded-2xl p-8 border border-cyan-500/30 backdrop-blur-sm shadow-inner">
                  <p className="text-xl text-white font-medium leading-relaxed">{trainingPrompts[selectedPrompt].text}</p>
                  <span className="inline-block mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-bold border border-cyan-500/30">
                    {trainingPrompts[selectedPrompt].category}
                  </span>
                </div>
              </div>

              {/* VU Meter */}
              <div className="relative h-40 bg-gradient-to-br from-black/50 to-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden shadow-inner">
                <div className="absolute inset-0 flex items-end justify-center gap-1 p-6">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const height = Math.max(0, audioLevel - (i * 4.2));
                    const isActive = height > 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all duration-100"
                        style={{
                          height: `${height * 2}%`,
                          backgroundColor: isActive 
                            ? i > 18 ? '#ef4444' : i > 14 ? '#f59e0b' : i > 10 ? '#eab308' : '#06b6d4'
                            : '#1f2937',
                          boxShadow: isActive ? `0 0 12px ${i > 18 ? '#ef4444' : i > 14 ? '#f59e0b' : '#06b6d4'}` : 'none'
                        }}
                      />
                    );
                  })}
                </div>
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-3 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/30">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                    <span className="text-red-400 font-mono font-bold">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>

              {/* Record Button */}
              <div className="flex items-center justify-center py-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={micPermission !== 'granted'}
                  className={`relative w-40 h-40 rounded-full transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${
                    isRecording 
                      ? 'shadow-2xl shadow-red-500/50' 
                      : 'shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/60'
                  }`}
                  style={{
                    background: isRecording 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                  }}
                >
                  {/* Glossy overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                  
                  {/* Inner ring */}
                  <div className={`absolute inset-5 bg-gradient-to-br from-gray-900 to-black rounded-full shadow-inner flex items-center justify-center ${
                    isRecording ? 'animate-pulse' : ''
                  }`}>
                    {isRecording ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-lg" />
                    ) : (
                      <Mic className="w-16 h-16 text-white drop-shadow-lg" />
                    )}
                  </div>
                </button>
              </div>

              {/* Navigation */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPrompt((prev) => Math.max(0, prev - 1))}
                  disabled={selectedPrompt === 0}
                  className="flex-1 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 text-white py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => setSelectedPrompt((prev) => Math.min(trainingPrompts.length - 1, prev + 1))}
                  disabled={selectedPrompt === trainingPrompts.length - 1}
                  className="flex-1 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 text-white py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Recordings List */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 space-y-6 shadow-2xl">
              <h3 className="text-2xl font-bold text-white">Your Recordings</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {recordings.length === 0 ? (
                  <div className="text-center text-gray-500 py-20">
                    <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No recordings yet</p>
                    <p className="text-sm mt-2">Start recording to train your voice!</p>
                  </div>
                ) : (
                  recordings.map((recording, idx) => (
                    <div key={recording.id} className="bg-black/30 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-bold text-lg">Recording {idx + 1}</span>
                        <span className="text-cyan-400 font-mono text-sm">{formatTime(recording.duration)}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{recording.prompt}</p>
                      <audio controls src={recording.url} className="w-full" style={{filter: 'brightness(0.9) contrast(1.1)'}} />
                    </div>
                  ))
                )}
              </div>
              
              {recordings.length >= 10 && (
                <button 
                  onClick={() => alert('Training pipeline coming soon!')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-5 rounded-xl font-bold text-lg shadow-2xl shadow-cyan-500/30 transition-all hover:scale-105"
                >
                  🎤 Finish Training ({recordings.length} samples)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Studio/Mixer View - ULTRA REALISTIC */}
      {currentView === 'studio' && (
        <div className="flex flex-col min-h-screen p-8 gap-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-cyan-400 transition-colors text-lg">
              ← Back
            </button>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Professional Studio
            </h2>
            <button className="px-6 py-3 bg