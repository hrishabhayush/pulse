import asyncio
from flask import Flask, request, Response
from twilio.twiml.voice_response import VoiceResponse, Gather
from interview_agent import DoctorPatientAgent
import os
import json

app = Flask(__name__)
agent = DoctorPatientAgent(json.load(open('characters/interviewer.json')))

@app.route("/answer", methods=['GET', 'POST'])
def answer_call():
    """Endpoint for handling incoming calls"""
    response = VoiceResponse()
    
    # Start the consultation flow
    response.say("Thank you for calling Doctor AI. Please wait while we connect you.")
    response.redirect(url='/consultation/start')
    
    return Response(str(response), mimetype='text/xml')

@app.route("/consultation/start", methods=['POST'])
def start_consultation():
    """Main consultation flow controller"""
    response = VoiceResponse()
    
    # Initial prompt with input gathering
    gather = Gather(
        input='speech',
        speech_timeout=3,
        action='/consultation/handle_response',
        method='POST'
    )
    gather.say("Hello, I'm Doctor Agent. Please describe your symptoms after the beep.")
    response.append(gather)
    response.play('https://demo.twilio.com/docs/classic.mp3')  # Beep sound
    
    return Response(str(response), mimetype='text/xml')

@app.route("/consultation/handle_response", methods=['POST'])
def handle_response():
    """Process user responses from phone call"""
    response = VoiceResponse()
    speech_result = request.form.get('SpeechResult', '')
    
    # Create new event loop for async processing
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Process with AI agent
        agent_response = loop.run_until_complete(
            agent.process_voice_input(speech_result)
        )
    finally:
        loop.close()
    
    # Check if conversation is ending
    if hasattr(agent, 'call_state') and agent.call_state == 'end':
        # End the call
        response.say(agent_response)
        response.hangup()
    else:
        # Continue conversation
        gather = Gather(
            input='speech',
            speech_timeout=5,
            action='/consultation/handle_response',
            method='POST'
        )
        gather.say(agent_response)
        response.append(gather)
    
    return Response(str(response), mimetype='text/xml')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001) 