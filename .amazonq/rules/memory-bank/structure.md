# VoiceClone Studio - Project Structure

## Directory Organization

```
VoiceGen/
├── .amazonq/
│   └── rules/
│       └── memory-bank/          # Project documentation
├── AI voice deepfake app for personalized song creation.md
├── project_log.md                # Development timeline and decisions
├── voice-clone-studio.tsx        # Main React application component
├── files/                        # Documentation and guides
├── RefereGUI/                     # UI reference images and assets
└── Project Log.pdf               # Additional project documentation
```

## Core Components

### Frontend Application (voice-clone-studio.tsx)
- **Main Application**: Single React component with multiple views
- **Home View**: Navigation hub with three main sections
- **Training View**: Voice recording and sample management
- **Studio View**: Professional mixer interface with effects
- **Generate View**: Song creation with lyrics and beat upload

### Component Architecture
```
VoiceCloneStudio (Root Component)
├── Home View
│   └── Navigation Cards (Train Voice, Generate Song, Mix & Master)
├── Training View
│   ├── Recording Interface
│   │   ├── Microphone Permission Handler
│   │   ├── Audio Level Visualization
│   │   ├── Recording Controls
│   │   └── Prompt Navigation
│   └── Recordings List
│       ├── Sample Playback
│       └── Training Progress
├── Studio View (Professional Mixer)
│   ├── Channel A (Cyan theme)
│   │   ├── Filter Knob (Large)
│   │   ├── EQ Section (Gain, Treble, Mid, Bass)
│   │   ├── Volume Fader
│   │   └── Cue Button
│   ├── Master Section
│   │   ├── Crossfader
│   │   ├── Master Faders (A, Master, B)
│   │   ├── Transport Controls
│   │   └── VU Meters
│   ├── Channel B (Orange theme)
│   │   └── [Same as Channel A]
│   └── Effects Rack
│       └── Effect Knobs (Reverb, Delay, Chorus, Phaser)
└── Generate View
    ├── Beat Upload Section
    ├── Lyrics Input
    ├── Vocal Style Selection
    └── Advanced Controls
```

## UI Component Library

### Professional Audio Controls
- **Knob Component**: 3D rotary controls with color-coded indicators
- **Fader Component**: Vertical sliders with gradient fills and scale markings
- **VU Meter Component**: LED-style bar graphs with color progression
- **Toggle Switch Component**: Professional on/off switches
- **LED Indicator Component**: Status lights with glow effects

### Design System
- **Color Scheme**: Dark theme with cyan, orange, purple accents
- **Typography**: Modern sans-serif with monospace for technical displays
- **Shadows**: Deep 3D shadows for skeuomorphic hardware appearance
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design with desktop optimization

## State Management

### Application State
```javascript
{
  currentView: 'home' | 'train' | 'studio' | 'generate',
  isRecording: boolean,
  recordingTime: number,
  audioLevel: number,
  recordings: Array<Recording>,
  micPermission: 'granted' | 'denied' | null,
  selectedPrompt: number,
  knobValues: {
    filterA: number,
    gainA: number,
    trebleA: number,
    // ... all mixer controls
  },
  toggleStates: {
    channelA: boolean,
    channelB: boolean,
    effects: boolean,
    // ... all toggle switches
  }
}
```

### Audio Processing Pipeline
1. **Microphone Access**: Web Audio API integration
2. **Real-time Analysis**: Audio level monitoring and visualization
3. **Recording**: MediaRecorder API with WebM/Opus encoding
4. **Storage**: Local blob storage with metadata
5. **Playback**: HTML5 audio elements with custom controls

## Backend Architecture (Planned)

### API Structure
```
/api/
├── /auth              # User authentication
├── /record            # Voice recording endpoints
│   ├── /verify-device # Microphone verification
│   └── /upload        # Sample upload and validation
├── /voice             # Voice model management
│   ├── /train         # Training job initiation
│   ├── /status        # Training progress
│   └── /models        # Model listing and management
├── /generate          # Song generation
│   ├── /vendor        # ElevenLabs API integration
│   └── /local         # Local model inference
├── /fx                # Audio effects processing
└── /audit             # Security and compliance logging
```

### Data Models
- **User**: Authentication and profile data
- **Recording**: Voice samples with metadata
- **VoiceModel**: Trained AI models and configurations
- **Generation**: Created songs and processing history
- **AuditLog**: Security events and compliance tracking

## Integration Points

### External Services
- **ElevenLabs API**: Voice cloning and text-to-speech
- **AWS Services**: S3 storage, Lambda processing, SageMaker training
- **Audio Processing**: librosa, PyTorch for local inference

### Security Layers
- **Microphone Verification**: Hardware device validation
- **Audio Authenticity**: CNN-based replay detection
- **User Consent**: Explicit permission tracking
- **Data Encryption**: End-to-end audio data protection

## Deployment Architecture

### Frontend Deployment
- **Static Hosting**: S3 + CloudFront for global distribution
- **HTTPS Required**: Microphone API access requirement
- **Progressive Web App**: Offline capability and mobile optimization

### Backend Infrastructure
- **API Gateway**: Request routing and rate limiting
- **Lambda Functions**: Serverless audio processing
- **EC2/SageMaker**: GPU-accelerated model training
- **RDS/DynamoDB**: Persistent data storage
- **S3 Buckets**: Audio file storage with lifecycle policies