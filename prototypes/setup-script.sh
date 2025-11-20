#!/bin/bash

# VoiceClone Studio - Initial Setup Script
# This script creates the project structure and initializes everything

set -e

echo "🎤 VoiceClone Studio - Project Setup"
echo "====================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create project directory structure
echo -e "\n${YELLOW}Creating project structure...${NC}"

mkdir -p src
mkdir -p public
mkdir -p backend/lambda

echo -e "${GREEN}✓ Directories created${NC}"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo -e "\n${YELLOW}Creating package.json...${NC}"
    cat > package.json <<'EOF'
{
  "name": "voiceclone-studio",
  "version": "1.0.0",
  "description": "AI Voice Cloning Studio for Music Creation",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && aws s3 sync dist/ s3://voiceclone-studio-app --delete"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
EOF
    echo -e "${GREEN}✓ package.json created${NC}"
fi

# Create vite.config.js
if [ ! -f "vite.config.js" ]; then
    echo -e "\n${YELLOW}Creating vite.config.js...${NC}"
    cat > vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});
EOF
    echo -e "${GREEN}✓ vite.config.js created${NC}"
fi

# Create tailwind.config.js
if [ ! -f "tailwind.config.js" ]; then
    echo -e "\n${YELLOW}Creating tailwind.config.js...${NC}"
    cat > tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
    echo -e "${GREEN}✓ tailwind.config.js created${NC}"
fi

# Create postcss.config.js
if [ ! -f "postcss.config.js" ]; then
    echo -e "\n${YELLOW}Creating postcss.config.js...${NC}"
    cat > postcss.config.js <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    echo -e "${GREEN}✓ postcss.config.js created${NC}"
fi

# Create .gitignore
if [ ! -f ".gitignore" ]; then
    echo -e "\n${YELLOW}Creating .gitignore...${NC}"
    cat > .gitignore <<'EOF'
# Dependencies
node_modules/
package-lock.json

# Build output
dist/
.vite/

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# AWS
.aws/

# Temp files
/tmp/
EOF
    echo -e "${GREEN}✓ .gitignore created${NC}"
fi

# Create .env.example
if [ ! -f ".env.example" ]; then
    echo -e "\n${YELLOW}Creating .env.example...${NC}"
    cat > .env.example <<'EOF'
# API Configuration
VITE_API_ENDPOINT=https://your-api-gateway.amazonaws.com/prod

# AWS Configuration (for deployment)
AWS_REGION=us-east-1
AWS_S3_BUCKET=voiceclone-studio-app
EOF
    echo -e "${GREEN}✓ .env.example created${NC}"
fi

# Check if source files already exist
echo -e "\n${YELLOW}Checking source files...${NC}"

files_to_create=(
    "src/App.jsx"
    "src/main.jsx"
    "src/index.css"
    "public/index.html"
    "backend/lambda/upload_handler.py"
)

missing_files=()
for file in "${files_to_create[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  The following source files are missing:${NC}"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo -e "\n${YELLOW}Please copy these files from the artifacts provided.${NC}"
else
    echo -e "${GREEN}✓ All source files present${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
if command -v npm &> /dev/null; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  npm not found. Please install Node.js first.${NC}"
fi

# Make deploy script executable
if [ -f "deploy.sh" ]; then
    chmod +x deploy.sh
    echo -e "${GREEN}✓ Made deploy.sh executable${NC}"
fi

# Final instructions
echo -e "\n${GREEN}======================================"
echo -e "✅ Project Setup Complete!"
echo -e "======================================${NC}"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "\n1. ${GREEN}Copy the source files${NC} from the provided artifacts:"
echo -e "   • src/App.jsx"
echo -e "   • src/main.jsx"
echo -e "   • src/index.css"
echo -e "   • public/index.html"
echo -e "   • backend/lambda/upload_handler.py"
echo -e "\n2. ${GREEN}Start development server:${NC}"
echo -e "   npm run dev"
echo -e "\n3. ${GREEN}Test locally:${NC}"
echo -e "   Open http://localhost:3000"
echo -e "   Allow microphone access when prompted"
echo -e "\n4. ${GREEN}Deploy to AWS:${NC}"
echo -e "   ./deploy.sh"
echo -e "\n${YELLOW}Documentation:${NC}"
echo -e "   • README.md - Project overview"
echo -e "   • AWS-DEPLOYMENT-GUIDE.md - Detailed AWS setup"
echo -e "\n${GREEN}Happy coding! 🎤🎵${NC}\n"
