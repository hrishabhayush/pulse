# Pulse

## Problem
Sky-high costs, long wait times, and endless bureaucracy sometimes make you feel like you’re filing taxes instead of seeking care for your well-being in the healthcare system. Especially for underserved communities this makes healthcare inaccessible, resulting in untreated illnesses.

## Insights
What if we had access to a personal healthcare assistant at all times just one call away?

## Solution
Pulse, an AI healthcare agent, trained on past medical papers and healthcare articles help diagnose any issues, and offer immediate care recommendations. While handling the initial paperwork required to get your treatment started and sending it directly to your nearest hospital or clinic. 

## 🚀 Setup Guide

Follow these steps to set up both the AI agent backend and the mobile application.

### Prerequisites

- Python 3.9+ for the AI agent
- Node.js 18+ and npm/yarn for the React Native app
- OpenAI API key for the AI doctor functionality
- Twilio account for voice calls (optional)
- MongoDB (optional, for data persistence)

### Environment Setup

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/pulse.git
cd pulse
```

2. **Set up the AI agent backend:**

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
```

3. **Set up the Mobile App:**

```bash
cd ../project

# Install dependencies
npm install
# or
yarn install

# For iOS
cd ios && pod install && cd ..
```