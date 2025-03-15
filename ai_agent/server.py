from flask import Flask
import os
import sys

# Add the current directory to the path so we can import the interview agent
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import required module for Twilio integration
from twilio.twiml.voice_response import VoiceResponse

app = Flask(__name__)

@app.route("/answer", methods=['GET', 'POST'])
def answer_call():
    """Respond to incoming phone calls with a brief message."""
    # Start our TwiML response
    resp = VoiceResponse()

    # Read a message aloud to the caller
    resp.say("Thank you for calling! Have a great day.", voice='Polly.Amy')

    return str(resp)
if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True)

