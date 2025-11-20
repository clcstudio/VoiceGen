import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Music, Settings, Play, Pause, SkipBack, SkipForward, Volume2, Sliders } from 'lucide-react';

const VoiceCloneStudio = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [micPermission, setMicPermission] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setMicPermission('denied');
      console.error('Mic permission denied:', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => [...prev, {
          id: Date.now(),
          url,
          duration: recordingTime,
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

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      visualize();
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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

  const HomeView = () => (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          VoiceClone Studio
        </h1>
        <p className="text-gray-400 text-lg">Professional AI Voice Training & Generation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <button
          onClick={() => {
            requestMicPermission();
            setCurrentView('train');
          }}
          className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-gray-700 hover:border-cyan-500 transition-all duration-300 shadow-xl hover:shadow-cyan-500/20"
        >
          <Mic className="w-12 h-12 mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-2">Train Voice</h3>
          <p className="text-gray-400 text-sm">Record samples to clone your voice</p>
        </button>

        <button
          onClick={() => setCurrentView('generate')}
          className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-xl hover:shadow-blue-500/20"
        >
          <Music className="w-12 h-12 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-2">Generate Song</h3>
          <p className="text-gray-400 text-sm">Create music with your AI voice</p>
        </button>

        <button
          onClick={() => setCurrentView('studio')}
          className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 shadow-xl hover:shadow-purple-500/20"
        >
          <Sliders className="w-12 h-12 mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold text-white mb-2">Mix & Master</h3>
          <p className="text-gray-400 text-sm">Professional audio effects</p>
        </button>
      </div>
    </div>
  );

  const TrainingView = () => (
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-white">
          ← Back
        </button>
        <h2 className="text-3xl font-bold text-white">Voice Training</h2>
        <div className="text-cyan-400 font-mono">{recordings.length}/20 samples</div>
      </div>

      {micPermission === 'denied' && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400">
          Microphone access denied. Please enable microphone permissions to continue.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 space-y-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-400 mb-2">Read this prompt:</div>
            <div className="bg-gray-950 rounded-lg p-6 border border-gray-700">
              <p className="text-lg text-white font-medium">{trainingPrompts[selectedPrompt].text}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                {trainingPrompts[selectedPrompt].category}
              </span>
            </div>
          </div>

          <div className="relative h-32 bg-gray-950 rounded-lg border border-gray-700 overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-center gap-1 p-4">
              {[...Array(20)].map((_, i) => {
                const height = Math.max(0, audioLevel - (i * 5));
                const isActive = height > 0;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all duration-100"
                    style={{
                      height: `${height * 2}%`,
                      backgroundColor: isActive 
                        ? i > 15 ? '#ef4444' : i > 10 ? '#f59e0b' : '#06b6d4'
                        : '#1f2937',
                      boxShadow: isActive ? `0 0 10px ${i > 15 ? '#ef4444' : i > 10 ? '#f59e0b' : '#06b6d4'}` : 'none'
                    }}
                  />
                );
              })}
            </div>
            {isRecording && (
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={micPermission === 'denied'}
              className={`relative w-32 h-32 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50' 
                  : 'bg-gradient-to-br from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`absolute inset-4 bg-gray-900 rounded-full flex items-center justify-center ${
                isRecording ? 'animate-pulse' : ''
              }`}>
                {isRecording ? (
                  <div className="w-8 h-8 bg-red-500 rounded" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </div>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPrompt((prev) => Math.max(0, prev - 1))}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              disabled={selectedPrompt === 0}
            >
              Previous
            </button>
            <button
              onClick={() => setSelectedPrompt((prev) => Math.min(trainingPrompts.length - 1, prev + 1))}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              disabled={selectedPrompt === trainingPrompts.length - 1}
            >
              Next
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-xl font-bold text-white">Your Recordings</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {recordings.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No recordings yet. Start recording to train your voice!
              </div>
            ) : (
              recordings.map((recording, idx) => (
                <div key={recording.id} className="bg-gray-950 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Recording {idx + 1}</span>
                    <span className="text-gray-400 text-sm font-mono">{formatTime(recording.duration)}</span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-1">{recording.prompt}</p>
                  <audio controls src={recording.url} className="w-full mt-2" />
                </div>
              ))
            )}
          </div>
          
          {recordings.length >= 10 && (
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
              Finish Training ({recordings.length} samples)
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const StudioView = () => (
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-white">
          ← Back
        </button>
        <h2 className="text-3xl font-bold text-white">Audio Studio</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
            Load Beat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-cyan-400 font-bold mb-4 text-center">CHANNEL A</h3>
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full border-4 border-gray-700 shadow-inner" />
              <div className="absolute inset-2 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full" />
              <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-cyan-400 origin-bottom -translate-x-1/2 -translate-y-full shadow-lg shadow-cyan-400/50" 
                   style={{ transform: 'translate(-50%, -100%) rotate(45deg)' }} />
            </div>
            <span className="text-gray-400 text-sm">FILTER</span>
          </div>

          {['GAIN', 'TREBLE', 'MID', 'BASS'].map((label, idx) => (
            <div key={label} className="flex flex-col items-center mb-4">
              <div className="relative w-16 h-16 mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full border-2 border-gray-700 shadow-inner" />
                <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full" />
                <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-cyan-400 origin-bottom -translate-x-1/2 -translate-y-full" 
                     style={{ transform: `translate(-50%, -100%) rotate(${idx * 30 - 45}deg)` }} />
              </div>
              <span className="text-gray-400 text-xs">{label}</span>
              <span className="text-cyan-400 text-xs font-mono">MIN → MAX</span>
            </div>
          ))}

          <div className="flex flex-col items-center mt-8">
            <div className="relative w-12 h-48 bg-gray-950 rounded-lg border border-gray-700">
              <div className="absolute inset-x-0 top-20 h-12 bg-gradient-to-b from-cyan-500 to-transparent" />
              <div className="absolute inset-x-0 top-20 h-3 bg-cyan-500 shadow-lg shadow-cyan-500/50" />
            </div>
            <span className="text-gray-400 text-xs mt-2">VOLUME</span>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 border-4 border-gray-700 shadow-lg hover:shadow-cyan-500/50 transition-all">
              <span className="text-white text-xs font-bold">CUE</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-white font-bold mb-4 text-center">MASTER</h3>
          
          <div className="mb-8">
            <div className="relative h-32 bg-gray-950 rounded-lg border border-gray-700 p-4">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-24 bg-gradient-to-b from-gray-600 to-gray-700 rounded-lg border-2 border-gray-500 shadow-xl" />
              </div>
              <div className="absolute bottom-2 left-4 text-cyan-400 text-xs">A</div>
              <div className="absolute bottom-2 right-4 text-amber-400 text-xs">B</div>
            </div>
            <span className="block text-center text-gray-400 text-xs mt-2">CROSSFADER</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {['A', 'MASTER', 'B'].map((label, idx) => (
              <div key={label} className="flex flex-col items-center">
                <div className="relative w-10 h-40 bg-gray-950 rounded-lg border border-gray-700">
                  <div className={`absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t ${
                    idx === 0 ? 'from-cyan-500' : idx === 1 ? 'from-white' : 'from-amber-500'
                  } to-transparent`} />
                  <div className={`absolute inset-x-0 ${idx === 1 ? 'top-12' : 'top-20'} h-2 ${
                    idx === 0 ? 'bg-cyan-500 shadow-cyan-500/50' : 
                    idx === 1 ? 'bg-white shadow-white/50' : 
                    'bg-amber-500 shadow-amber-500/50'
                  } shadow-lg`} />
                </div>
                <span className="text-gray-400 text-xs mt-2">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mb-6">
            <button className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
              <SkipBack className="w-5 h-5 text-white" />
            </button>
            <button className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50 rounded-lg flex items-center justify-center transition-all">
              <Play className="w-8 h-8 text-white" />
            </button>
            <button className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
              <SkipForward className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex gap-2 h-32">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex-1 bg-gray-950 rounded border border-gray-700 p-1">
                <div className="h-full flex flex-col-reverse gap-0.5">
                  {[...Array(20)].map((_, j) => (
                    <div
                      key={j}
                      className={`flex-1 rounded-sm ${
                        j < 15 ? (i === 0 ? 'bg-cyan-500' : 'bg-amber-500') : 
                        j < 18 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        opacity: j < (12 + Math.random() * 4) ? 1 : 0.2,
                        boxShadow: j < (12 + Math.random() * 4) ? '0 0 5px currentColor' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-amber-400 font-bold mb-4 text-center">CHANNEL B</h3>
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-24 h-24 mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full border-4 border-gray-700 shadow-inner" />
              <div className="absolute inset-2 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full" />
              <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-amber-400 origin-bottom -translate-x-1/2 -translate-y-full shadow-lg shadow-amber-400/50" 
                   style={{ transform: 'translate(-50%, -100%) rotate(-45deg)' }} />
            </div>
            <span className="text-gray-400 text-sm">FILTER</span>
          </div>

          {['GAIN', 'TREBLE', 'MID', 'BASS'].map((label, idx) => (
            <div key={label} className="flex flex-col items-center mb-4">
              <div className="relative w-16 h-16 mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full border-2 border-gray-700 shadow-inner" />
                <div className="absolute inset-1 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full" />
                <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-amber-400 origin-bottom -translate-x-1/2 -translate-y-full" 
                     style={{ transform: `translate(-50%, -100%) rotate(${-idx * 30 + 45}deg)` }} />
              </div>
              <span className="text-gray-400 text-xs">{label}</span>
              <span className="text-amber-400 text-xs font-mono">MIN → MAX</span>
            </div>
          ))}

          <div className="flex flex-col items-center mt-8">
            <div className="relative w-12 h-48 bg-gray-950 rounded-lg border border-gray-700">
              <div className="absolute inset-x-0 top-20 h-12 bg-gradient-to-b from-amber-500 to-transparent" />
              <div className="absolute inset-x-0 top-20 h-3 bg-amber-500 shadow-lg shadow-amber-500/50" />
            </div>
            <span className="text-gray-400 text-xs mt-2">VOLUME</span>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 border-4 border-gray-700 shadow-lg hover:shadow-amber-500/50 transition-all">
              <span className="text-white text-xs font-bold">CUE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const GenerateView = () => (
    <div className="flex flex-col h-full p-8 gap-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentView('home')} className="text-gray-400 hover:text-white">
          ← Back
        </button>
        <h2 className="text-3xl font-bold text-white">Generate Song</h2>
        <div />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-xl font-bold text-white">Upload Beat</h3>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-cyan-500 transition-colors cursor-pointer">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">Drop your beat here or click to browse</p>
            <p className="text-gray-500 text-sm mt-2">MP3, WAV, or OGG</p>
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Song Lyrics</label>
            <textarea 
              className="w-full h-48 bg-gray-950 border border-gray-700 rounded-lg p-4 text-white resize-none focus:border-cyan-500 focus:outline-none"
              placeholder="Enter your lyrics here..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Vocal Style</label>
            <select className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none">
              <option>Rap - Energetic</option>
              <option>Rap - Laid Back</option>
              <option>Singing - Pop</option>
              <option>Singing - R&B</option>
              <option>Singing - Rock</option>
            </select>
          </div>

          <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-lg font-bold hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
            Generate with AI
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 space-y-4">
          <h3 className="text-xl font-bold text-white">Advanced Controls</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Energy Level</label>
              <input type="range" min="0" max="100" className="w-full" />
            </div>
            
            <div>
              <label className="text-gray-400 text-sm block mb-2">Pitch Shift</label>
              <input type="range" min="-12" max="12" defaultValue="0" className="w-full" />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Tempo (BPM)</label>
              <input type="number" defaultValue="120" min="60" max="200" className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none" />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Auto-Tune Strength</label>
              <input type="range" min="0" max="100" defaultValue="50" className="w-full" />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Reverb</label>
              <input type="range" min="0" max="100" defaultValue="30" className="w-full" />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-2">Add Harmonies</label>
              <select className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none">
                <option>None</option>
                <option>Low Harmony</option>
                <option>High Harmony</option>
                <option>Both</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4 mt-6">
            <h4 className="text-white font-bold mb-3">Vocal Directions</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="breath" className="w-4 h-4" />
                <label htmlFor="breath" className="text-gray-400 text-sm">Add breath sounds</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="adlibs" className="w-4 h-4" />
                <label htmlFor="adlibs" className="text-gray-400 text-sm">Generate ad-libs</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="emotion" className="w-4 h-4" defaultChecked />
                <label htmlFor="emotion" className="text-gray-400 text-sm">Emotional delivery</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black overflow-hidden">
      {currentView === 'home' && <HomeView />}
      {currentView === 'train' && <TrainingView />}
      {currentView === 'studio' && <StudioView />}
      {currentView === 'generate' && <GenerateView />}
    </div>
  );
};

export default VoiceCloneStudio