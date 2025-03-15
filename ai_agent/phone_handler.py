import os
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Start
from aiohttp import web
import uuid
from .interview_agent import DoctorPatientAgent  # Link to your existing agent

class PhoneCallManager:
    def __init__(self, agent: DoctorPatientAgent):
        self.agent = agent
        self.twilio_client = Client(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN")
        )
        self.active_calls = {}

    async def handle_incoming_call(self, request):
        """Handle incoming call and start media stream"""
        response = VoiceResponse()
        call_id = str(uuid.uuid4())
        
        # Start WebSocket for bidirectional audio
        start = Start()
        start.stream(url=f"wss://{request.host}/stream/{call_id}")
        response.append(start)
        
        # Store call context
        self.active_calls[call_id] = {
            'status': 'connected',
            'transcript': [],
            'current_question': None
        }
        
        return web.Response(text=str(response), content_type='text/xml')

    async def handle_media(self, request):
        """Process real-time audio from the call"""
        stream_sid = request.match_info['stream_sid']
        data = await request.json()
        
        if data['event'] == 'media':
            # Process audio chunk
            media = data['media']
            transcript = await self.agent.process_audio(media['payload'])
            
            # Get AI response
            response_text = await self.agent.generate_response(transcript)
            await self.send_audio_response(stream_sid, response_text)
            
        return web.Response()

    async def send_audio_response(self, stream_sid: str, text: str):
        """Convert text to audio and send back through call"""
        audio_data = await self.agent.text_to_speech(text)
        self.twilio_client.media.streams(stream_sid).update(
            track="outbound_track",
            audio_data=audio_data,
            audio_format="pcm",
            audio_sample_rate=16000
        )