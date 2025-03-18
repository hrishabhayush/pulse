# Pulse

## Problem
Sky-high costs, long wait times, and endless bureaucracy sometimes make you feel like you’re filing taxes instead of seeking care for your well-being in the healthcare system. Especially for underserved communities this makes healthcare inaccessible, resulting in untreated illnesses.

## Insights
What if we had access to a personal healthcare assistant at all times just one call away?

## Solution
Pulse, an AI healthcare agent, trained on past medical papers and healthcare articles help diagnose any issues, and offer immediate care recommendations. While handling the initial paperwork required to get your treatment started and sending it directly to your nearest hospital or clinic. 

## 🚀 Setup Guide

![Pulse banner](assets/pulse.png)
Follow these steps to set up both the AI agent backend and the mobile application.

### Prerequisites

- Operating System: macOS or Linux (Windows has not been tested)
- Python 3.12 (required)
- Node.js 18+ (for web interface)
- Git
- Claude API key for the AI doctor functionality
- Twilio account for voice calls
- ngrok for deploying the local server

### Environment Setup

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/pulse.git
cd pulse
```
2. **Python Environment Setup**

**Using Poetry (Recommended)**:

```bash
# Install Poetry if you haven't
curl -sSL https://install.python-poetry.org | python3 -

# Set up the environment
poetry env use python3.12
poetry install
```

3. **Environment Variables**

### API Keys and Configuration

- **Core API Keys (Required)**

  - **Anthropic**
    - Get API key from [Anthropic Portal](https://console.anthropic.com/dashboard)
  - **OpenAI** (Required only for voice agent)
    - Get API key from [OpenAI Portal](https://platform.openai.com/api-keys)
  - **CDP**
    - Sign up at [CDP Portal](https://portal.cdp.coinbase.com/access/api)
  - **Hyperbolic** (Required for compute tools)
    - Sign up at [Hyperbolic Portal](https://app.hyperbolic.xyz)
    - Navigate to Settings to generate API key, this is also where you configure ssh access with your RSA public key
  - **LangChain**: Endpoint, API key, and project name
  - **Twilio**: SID, Toll-free number, Auth token, Server url
    - Use ngrok to get the server url and then add it to the Twilio console for phone calling


- **Browser Automation**

- Install Playwright browsers after installing dependencies:

```bash
poetry run playwright install
```

- **Environment Configuration**

```bash
# Copy and edit the environment file
cp .env.example .env
nano .env  # or use any text editor
```

- **API Keys**
The `.env.example` file contains all possible configurations. Required fields depend on which features you want to use and are specified in the file.


4. **Set up the AI agent backend:**

```bash
cd ai_agent

# Create and activate virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env
# Edit .env with your API keys and configuration

# Deploy the server that can listen the calls 
ngrok http 5001

# Run the backend server
python twilio_integration.py
```

5. **Set up the Mobile App:**

```bash
cd ../project

# Install dependencies
npm install
# or
yarn install

# For iOS
cd ios && pod install && cd ..

# For web app to display 
npm run dev
# or
yarn dev
```