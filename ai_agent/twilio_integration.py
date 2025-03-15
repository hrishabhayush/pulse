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
    """Start the call with a welcome message, then redirect to /consultation/start."""
    response = VoiceResponse()
    response.say("Welcome to Pulse Healthcare! Please hold while we connect you.")
    # IMPORTANT: Allow Twilio to make either GET or POST:
    # By default Twilio might request GET on the next route, so accept both here and there.
    # Make sure we redirect to the correct endpoint
    response.redirect(url='/consultation/start', method='POST')
    return Response(str(response), mimetype='text/xml')

@app.route("/consultation/start", methods=['GET', 'POST'])
def start_consultation():
    """Main consultation flow controller."""
    response = VoiceResponse()

    gather = Gather(
        input='speech',
        speech_timeout=3,
        action='/consultation/handle_response',
        method='POST'
    )
    gather.say("Please describe your symptoms after the beep.")
    response.append(gather)

    # Optional beep sound
    response.play('https://demo.twilio.com/docs/classic.mp3')

    return Response(str(response), mimetype='text/xml')

@app.route("/consultation/handle_response", methods=['GET', 'POST'])
def handle_response():
    """Process user responses from phone call."""
    response = VoiceResponse()
    speech_result = request.form.get('SpeechResult', '')

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Pass the speech result to the AI agent for analysis
        agent_response = loop.run_until_complete(agent.process_voice_input(speech_result))

        # If agent sets call_state to 'end', save and hang up
        if hasattr(agent, 'call_state') and agent.call_state == 'end':
            loop.run_until_complete(agent.save_phone_consultation())
            response.say(agent_response)
            response.hangup()
        else:
            # Otherwise, continue the conversation
            gather = Gather(
                input='speech',
                speech_timeout=5,
                action='/consultation/handle_response',
                method='POST'
            )
            gather.say(agent_response)
            response.append(gather)
    finally:
        loop.close()

    return Response(str(response), mimetype='text/xml')

@app.route("/consultations/latest", methods=['GET'])
def get_latest_consultation():
    """
    Returns the most recent consultation data.
    Assumes consultation files are named in chronological order,
    such as consultation_YYYYMMDD_HHMMSS.json.
    """
    cons_dir = "frontend/consultations"
    if not os.path.exists(cons_dir):
        return {"error": "No consultations directory found"}, 404

    all_files = [f for f in os.listdir(cons_dir) if f.startswith("consultation_") and f.endswith(".json")]
    if not all_files:
        return {"error": "No consultations found"}, 404

    # Sort by filename descending to get the newest
    all_files.sort(reverse=True)
    newest = all_files[0]

    with open(os.path.join(cons_dir, newest), "r") as f:
        data = json.load(f)

    return data, 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)