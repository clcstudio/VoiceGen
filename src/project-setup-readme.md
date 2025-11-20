# VoiceClone Studio 🎤

AI-powered voice cloning application for music creation. Train your voice, then use it to sing or rap any song!

## Project Structure

```
voiceclone-studio/
├── src/
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── backend/
│   └── lambda/
│       └── upload_handler.py # Lambda function for uploads
├── public/
│   └── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── deploy.sh                # Auto-deployment script
└── AWS-DEPLOYMENT-GUIDE.md  # Detailed deployment guide
```

## Quick Start (Local Development)

### 1. Clone and Install

```bash
# Create project directory
mkdir voiceclone-studio
cd voiceclone-studio

# Initialize npm project (if not already done)
npm init -y

# Install dependencies
npm install
```

### 2. Create Required Files

Create the following files in your project directory:

- `src/App.jsx` - Main application (already created)
- `src/main.jsx` - Entry point
- `src/index.css` - Styles
- `public/index.html` - HTML template
- Configuration files (package.json, vite.config.js, etc.)

### 3. Run Locally

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

**Note**: Microphone access requires HTTPS in production. Local dev works with HTTP.

## AWS Deployment (Production)

### Prerequisites

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Key, and default region
   ```
3. **Node.js 18+** and **npm**

### Option 1: Automated Deployment (Recommended)

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
- ✅ Create S3 buckets (frontend + audio storage)
- ✅ Configure static website hosting
- ✅ Set up CORS policies
- ✅ Create IAM roles
- ✅ Deploy Lambda functions
- ✅ Build and upload frontend

### Option 2: Manual Deployment

Follow the detailed guide in `AWS-DEPLOYMENT-GUIDE.md`

## Configuration

### Environment Variables

Create `.env.production`:

```env
VITE_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

Update after creating API Gateway in AWS Console.

## Features

### ✅ Currently Working

- 🎤 **Voice Recording** - High-quality mic capture with real-time visualization
- 📊 **VU Meters** - Professional audio level monitoring
- 💾 **Local Storage** - Save recordings for training
- 🎨 **Studio UI** - Skeuomorphic audio interface design
- 📱 **Responsive** - Works on desktop, tablet, and mobile

### 🚧 Coming Soon

- 🤖 **AI Voice Training** - RVC-based voice cloning
- 🎵 **Beat Analysis** - Automatic tempo/key detection
- 🎙️ **Song Generation** - Generate vocals with your voice
- 🎛️ **Audio Effects** - Auto-tune, reverb, compression, EQ
- 👥 **Multi-user** - User authentication and profiles
- 💳 **Payment System** - Subscription tiers

## Architecture

```
┌─────────────┐
│   Browser   │
│  (React App)│
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────┐      ┌──────────────┐
│ CloudFront  │─────→│ S3 (Frontend)│
└──────┬──────┘      └──────────────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│API Gateway  │─────→│    Lambda    │─────→│ S3 (Audio)  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ↓
                     ┌──────────────┐
                     │  SageMaker   │ (Training)
                     └──────────────┘
```

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Web Audio API** - Microphone access & visualization

### Backend
- **AWS Lambda** - Serverless compute
- **API Gateway** - REST API
- **S3** - Storage (frontend + audio files)
- **CloudFront** - CDN (optional)
- **SageMaker** - ML model training (future)

### AI/ML (Planned)
- **RVC (Retrieval-based Voice Conversion)** - Voice cloning
- **Librosa** - Audio processing
- **PyTorch** - Deep learning

## Development

### Project Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to AWS
npm run deploy
```

### Adding New Features

1. **New View**: Add to `currentView` state in `App.jsx`
2. **New API Call**: Update Lambda functions in `backend/lambda/`
3. **New Styling**: Modify `tailwind.config.js` or add to `src/index.css`

## Troubleshooting

### Microphone Not Working

**Local Development**:
- Use `http://localhost:3000` (works without HTTPS)
- Allow mic permissions when prompted

**Production**:
- **Must use HTTPS** - microphone API requires secure context
- Set up CloudFront with SSL certificate
- Or use S3 website URL with custom domain + HTTPS

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run build
```

### AWS Deployment Issues

- **S3 Bucket Already Exists**: Change bucket name in deploy script
- **IAM Permissions**: Ensure AWS user has admin or sufficient permissions
- **Lambda Timeout**: Increase timeout in Lambda configuration
- **CORS Errors**: Check S3 bucket CORS configuration

## Cost Estimate

For **personal use** (100 users/month):
- S3: ~$1-5/month
- Lambda: ~$0-2/month (free tier)
- API Gateway: ~$1-3/month
- CloudFront: ~$1-5/month
- **Total: ~$3-15/month**

For **moderate scale** (1000 users/month):
- ~$50-100/month

**Training costs** (SageMaker):
- ml.p3.2xlarge: ~$3/hour (only during training)

## Security

- ✅ HTTPS required for production
- ✅ CORS configured for API access
- ✅ S3 bucket policies for public/private access
- 🚧 User authentication (Cognito) - coming soon
- 🚧 API rate limiting - coming soon
- 🚧 Content moderation - coming soon

## Roadmap

### Phase 1: MVP (Current)
- [x] Voice recording interface
- [x] Audio visualization
- [x] AWS deployment setup
- [ ] Complete API Gateway setup
- [ ] Lambda upload implementation

### Phase 2: AI Integration
- [ ] RVC model integration
- [ ] Voice training pipeline
- [ ] Basic song generation

### Phase 3: Production Ready
- [ ] User authentication
- [ ] Payment system
- [ ] Beat upload & analysis
- [ ] Advanced audio effects
- [ ] Mobile apps (React Native)

### Phase 4: Scale
- [ ] Collaboration features
- [ ] Marketplace for beats
- [ ] Social sharing
- [ ] API for developers

## Contributing

This is a personal project, but suggestions are welcome!

## License

MIT License - Feel free to use for personal/commercial projects

## Support

- 📧 Email: support@voiceclone-studio.com (placeholder)
- 📖 Docs: See AWS-DEPLOYMENT-GUIDE.md
- 🐛 Issues: Check CloudWatch Logs and browser console

---

**Built with ❤️ for music creators who can't sing (yet)** 🎤🎵
