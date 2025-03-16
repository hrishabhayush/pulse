import asyncio
from flask import Flask, request, Response, jsonify
from flask_cors import CORS  # Add this import
from twilio.twiml.voice_response import VoiceResponse, Gather
from interview_agent import DoctorPatientAgent
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
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
# def start_consultation():
    # """Main consultation flow controller."""
    # response = VoiceResponse()

    # gather = Gather(
    #     input='speech',
    #     speech_timeout=3,
    #     action='/consultation/handle_response',
    #     method='POST'
    # )
    # response.append(gather)

    # # Remove music playback

    # return Response(str(response), mimetype='text/xml')

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
                speech_timeout=3,
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
    Assumes consultation files are named with timestamp, like
    phone_consultation_rachelle_20250316_001825.json.
    """
    # Look in multiple possible directories for consultation files
    possible_dirs = [
        "consultations",                # Current directory
        "ai_agent/consultations",       # From project root
        "../consultations",             # One level up
        "./consultations",              # Explicitly current directory
        "/Users/hrishabhayush/Documents/Projects/pulse/ai_agent/consultations"  # Absolute path
    ]
    
    cons_dir = None
    checked_paths = []
    
    for directory in possible_dirs:
        checked_paths.append(os.path.abspath(directory))
        if os.path.exists(directory):
            # Check if this directory has any consultation files
            try:
                files = [f for f in os.listdir(directory) 
                        if (f.startswith("consultation_") or f.startswith("phone_consultation_")) 
                        and f.endswith(".json")]
                if files:
                    cons_dir = directory
                    print(f"Found consultation directory: {os.path.abspath(directory)}")
                    break
            except Exception as e:
                print(f"Error checking directory {directory}: {e}")
    
    if not cons_dir:
        # Print out what directories we checked for debugging
        print(f"Could not find consultations directory. Checked: {checked_paths}")
        return {"error": "No consultations directory with files found", "checked": checked_paths}, 404

    # Find all consultation files
    all_files = [f for f in os.listdir(cons_dir) 
                if (f.startswith("consultation_") or f.startswith("phone_consultation_")) 
                and f.endswith(".json")]
    
    if not all_files:
        return {"error": "No consultations found in directory", "directory": cons_dir}, 404

    # Sort by filename descending to get the newest
    # This works if filenames contain timestamps
    all_files.sort()
    newest = all_files[0]
    
    file_path = os.path.join(cons_dir, newest)
    print(f"Loading consultation from: {file_path}")
    
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
        
        # Add content type and CORS headers
        response = app.response_class(
            response=json.dumps(data),
            status=200,
            mimetype='application/json'
        )
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    except Exception as e:
        print(f"Error loading consultation: {e}")
        return {"error": f"Failed to load consultation: {str(e)}"}, 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)