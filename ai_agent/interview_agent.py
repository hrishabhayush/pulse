import json
import os
import asyncio
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from dotenv import load_dotenv
from server.src.langchain_openai_voice_module import OpenAIVoice
from web3 import Web3
from langchain_openai_voice import OpenAIVoice
from web3 import Web3
from langchain_anthropic import ChatAnthropic
from eth_account import Account
import logging
from browser_agent import BrowserToolkit, BrowserTool
from coinbase_agentkit import (
    AgentKit,
    AgentKitConfig,
    CdpWalletProvider,
    CdpWalletProviderConfig,
    cdp_api_action_provider,
    cdp_wallet_action_provider,
    erc20_action_provider,
    pyth_action_provider,
    wallet_action_provider,
    weth_action_provider,
    twitter_action_provider,
)
from browser_use import Browser, BrowserConfig

# Load environment variables
load_dotenv(override=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MedicalConsultationException(Exception):
    """Custom exception for medical consultation flow control."""
    pass

class DoctorPatientAgent:
    def __init__(self, character_config: Dict[str, Any]):
        self.config = character_config
        self.conversation_history = []
        self.website_knowledge = {}
        self.llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
        # Initialize voice capabilities
        self.voice_enabled = os.getenv("VOICE_ENABLED", "false").lower() == "true"
        self.voice_llm = None
        if self.voice_enabled:
            self.voice_llm = OpenAIVoice(
                model=os.getenv("OPENAI_VOICE_MODEL", "gpt-4o"),
                voice=os.getenv("OPENAI_VOICE", "alloy"),
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
        self.current_question_index = 0
        self.follow_up_count = 0
        self.max_follow_ups = 2
        
        # Initialize browser toolkit
        self.browser_toolkit = BrowserToolkit.from_llm(self.llm)
        self.browser_tool = self.browser_toolkit.get_tools()[0]

        # Add browser configuration
        self.browser_tool.browser = Browser(
            config=BrowserConfig(
                chrome_instance_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                headless=True
            )
        )
        
        # Initialize wallet and AgentKit
        self.wallet_provider = CdpWalletProvider(CdpWalletProviderConfig())
        self.agent_kit = AgentKit(AgentKitConfig(
            wallet_provider=self.wallet_provider,
            action_providers=[
                cdp_api_action_provider(),
                cdp_wallet_action_provider(),
                erc20_action_provider(),
                pyth_action_provider(),
                wallet_action_provider(),
                weth_action_provider(),
                twitter_action_provider(),
            ]
        ))
        
        self.patient_data = {}
        self.current_symptoms = []
        self.medical_history = []
        self.prescription = []
        
    async def record_voice_input(self) -> str:
        """Record audio from the user and transcribe it to text."""
        if not self.voice_enabled or not self.voice_llm:
            return ""
            
        try:
            print("\nListening... (Please speak now)")
            # In a real implementation, this would use a library like sounddevice to record audio
            # For this example, we'll simulate the recording process
            audio_file_path = await self.voice_llm.record_audio(seconds=10)
            transcript = self.voice_llm.transcribe(audio_file_path)
            print(f"\nTranscribed: {transcript}")
            return transcript
        except Exception as e:
            logger.error(f"Error recording or transcribing audio: {e}")
            return ""

    async def speak_text(self, text: str) -> None:
        """Convert text to speech and play it through speakers."""
        if not self.voice_enabled or not self.voice_llm:
            return
            
        try:
            print("\nSpeaking response...")
            # Get audio response from voice LLM
            audio_response = await self.voice_llm.synthesize_speech(text)
            
            # Extract audio data and sampling rate from the response
            audio_data = audio_response.audio_data
            sampling_rate = audio_response.sampling_rate
            
            # Import sounddevice for audio playback
            import sounddevice as sd
            
            # Play audio data with the correct sampling rate
            sd.play(audio_data, sampling_rate)
            sd.wait()  # Wait until audio playback is done
            
            print("\n[Voice speaking complete]")
        except Exception as e:
            logger.error(f"Error in text-to-speech: {e}")

    async def conduct_consultation(self):
        """Conduct the medical consultation process."""
        logger.info("Starting medical consultation...")

        # Greet user with a calm and welcoming demeanor
        greeting = "Hello, I'm Dr. Agent. I'm here to help you today. Can you please share your symptoms with me?"
        print(greeting)
        if self.voice_enabled and self.voice_llm:
            await self.speak_text(greeting)

        try:
            # Inquire about patient's symptoms
            initial_assessment = await self.ask_question("Can you describe the symptoms you're experiencing?")
            self.current_symptoms = await self.analyze_symptoms(initial_assessment)
            
            # Check if we have basic demographics, if not, then ask
            if "demographics" not in self.patient_data or not self.patient_data["demographics"]:
                print("I didn't catch your name, age, and sex. Could you please tell me?")
                demographics_input = await self.ask_question("Your name, age, and sex?")
                # ... (code to parse demographics_input as needed)
            
            # Ask about medical history
            history_response = await self.ask_question("Do you have any relevant medical history or existing conditions?")
            self.medical_history = await self.analyze_medical_history(history_response)
            
            # Ask about medications
            meds_response = await self.ask_question("Are you currently taking any medications or supplements?")
            current_meds = await self.identify_medications(meds_response)
            if current_meds:
                logger.info("Current medications identified, taking them into consideration.")
                self.patient_data["current_medications"] = current_meds
            else:
                logger.info("No current medications reported.")
            
            # Allow user to ask questions or follow up
            follow_up_count = 0
            while follow_up_count < 3:
                needs_followup = await self.yn_needs_followup()
                if "No" in needs_followup:
                    break

                follow_up_question = await self.generate_followup_question()
                follow_up_response = await self.ask_question(follow_up_question)
                await self.update_assessment(follow_up_response)
                follow_up_count += 1
            
            # Generate prescription
            await self.generate_prescription()
            # See if the user is satisfied
            satisfaction = await self.ask_question("Do you have any more questions? (Yes/No)")
            if satisfaction.lower().strip() in ["no", "n"]:
                farewell = "Thank you. Get well soon and have a good day!"
                print(farewell)
                if self.voice_enabled and self.voice_llm:
                    await self.speak_text(farewell)
                return
            
            # Otherwise, let them ask more if needed
            extra_question = await self.ask_question("What else would you like to know?")
            # ... handle extra question ...
            
            # Finally, end the consultation
            farewell = "Take care and have a good day."
            print(farewell)
            if self.voice_enabled and self.voice_llm:
                await self.speak_text(farewell)
            
        except MedicalConsultationException as e:
            logger.info("Consultation ended: " + str(e))

    async def analyze_symptoms(self, response: str) -> List[str]:
        """Extract and classify symptoms from patient response."""
        prompt = f"""
        Patient reported: {response}
        List the key symptoms mentioned and their duration in JSON format:
        {{
            "symptoms": [
                {{
                    "name": "symptom name",
                    "duration": "duration description",
                    "severity": "mild/moderate/severe"
                }}
            ]
        }}
        
        Example valid response:
        {{
            "symptoms": [
                {{
                    "name": "headache",
                    "duration": "3 days",
                    "severity": "moderate"
                }}
            ]
        }}
        """
        try:
            result = await self.llm.ainvoke(prompt)
            parsed = json.loads(result.text())
            
            # Validate response structure
            if not isinstance(parsed.get("symptoms"), list):
                raise ValueError("Invalid symptoms format")
                
            return parsed["symptoms"]
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing symptoms: {e}. Response was: {result.text()}")
            return []  # Return empty list to continue consultation

    async def generate_followup_question(self) -> str:
        """Generate context-aware medical follow-up question with diagnostic focus."""
        prompt = f"""
        Based on the collected data:
        Symptoms: {self.current_symptoms}
        Medical History: {self.medical_history}
        
        Identify any gaps in information required to hypothesize a differential diagnosis. Frame a follow-up question focusing on:
        - Precision in symptom description (onset, duration, triggers)
        - Elucidating possible differential diagnoses
        - Clarifying associated risks or previous conditions
        
        Provide the question solely, excluding additional text.

        Example response:
        Could you specify if your chest pain occurs during physical exertion or at rest, and its exact location?
        """
        try:
            response = await self.llm.ainvoke(prompt)
            return response.text().strip()
        except Exception as e:
            logger.error(f"Error generating follow-up: {e}")
            return "Could you tell me more about that?"

    async def yn_needs_followup(self) -> str:
        """Determine if additional questions are needed."""
        prompt = f"""
        Current symptoms: {self.current_symptoms}
        Medical history: {self.medical_history}
        
        Is there need for additional questions to make a proper diagnosis?
        Answer only Yes or No.
        """
        return (await self.llm.ainvoke(prompt)).text().strip()

    async def generate_prescription(self):
        """Create medical prescription based on collected data."""
        prompt = f"""
        Patient Presentation:
        Symptoms: {self.current_symptoms}
        Medical History: {self.medical_history}
        
        Create a structured prescription including:
        - Medications (name, dosage, duration)
        - Diagnostic tests
        - Follow-up recommendations
        - Lifestyle advice
        
        Format as JSON:
        {{
            "prescription": {{
                "medications": [],
                "tests": [],
                "follow_up": [],
                "advice": []
            }},
            "diagnosis": "primary diagnosis"
        }}
        """
        result = await self.llm.ainvoke(prompt)
        self.prescription = json.loads(result.text())
        
        # Present to patient
        print("\n[Diagnosis]")
        print(self.prescription["diagnosis"])
        print("\n[Treatment Plan]")
        for med in self.prescription["prescription"]["medications"]:
            print(f"- {med['name']}: {med['dosage']} for {med['duration']}")

    async def save_consultation(self):
        """Save medical consultation data."""
        data = {
            "diagnosis": self.prescription["diagnosis"],
            "prescription": self.prescription["prescription"],
            "symptoms": self.current_symptoms,
            "medical_history": self.medical_history,
            "timestamp": datetime.now().isoformat()
        }
        
        os.makedirs("consultations", exist_ok=True)
        filename = f"consultations/consultation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
            
        logger.info(f"Consultation saved to {filename}")

    async def ask_question(self, question: str) -> str:
        """Ask a question following style rules."""
        # Apply style rules
        for rule in self.config["style"]["all"]:
            logger.debug(f"Applying style rule: {rule}")
        
        print(f"\n{question}")
        
        # Speak the question if voice is enabled
        if self.voice_enabled and self.voice_llm:
            await self.speak_text(question)
        
        # Determine whether to use voice or text input
        use_voice = self.voice_enabled and self.voice_llm
        
        response = ""
        if use_voice:
            print("Press Enter to speak your response, or type to respond with text: ", end="")
            text_input = input()
            
            # Check if user wants to exit the interview
            if self.is_exit_command(text_input):
                await self.handle_exit()
                raise MedicalConsultationException("User requested to exit consultation")
            
            if not text_input.strip():
                # Empty input means use voice
                response = await self.record_voice_input()
                # Check if voice response indicates an exit command
                if self.is_exit_command(response):
                    await self.handle_exit()
                    raise MedicalConsultationException("User requested to exit consultation")
                
                if not response:
                    # Fallback to text if voice fails
                    response = input("Voice input failed. Please type your response: ")
                    # Check again if fallback text input is an exit command
                    if self.is_exit_command(response):
                        await self.handle_exit()
                        raise MedicalConsultationException("User requested to exit consultation")
            else:
                # User typed something, use that as the response
                response = text_input
        else:
            # Standard text input
            response = input("Your response: ")
            # Check if user wants to exit the interview
            if self.is_exit_command(response):
                await self.handle_exit()
                raise MedicalConsultationException("User requested to exit consultation")
        
        # Record the conversation
        self.conversation_history.append({
            "question": question,
            "response": response,
            "timestamp": datetime.now().isoformat()
        })
        return response

    def is_exit_command(self, text: str) -> bool:
        """Check if the input text indicates a desire to exit the interview."""
        if not text:
            return False
        
        exit_commands = ["exit", "quit", "end", "stop", "bye", "goodbye", "terminate"]
        text_lower = text.lower().strip()
        
        # Check for exact matches
        if text_lower in exit_commands:
            return True
        
        # Check for phrases containing exit commands
        for cmd in exit_commands:
            if f"want to {cmd}" in text_lower or f"{cmd} consultation" in text_lower:
                return True
            
        return False

    async def handle_exit(self):
        """Handle the exit process gracefully."""
        print("\nExiting consultation. Saving consultation data...")
        
        # Save the consultation before exiting
        await self.save_consultation()
        
        print("Thank you for participating in the consultation. Goodbye!")

    async def collect_wallet_address(self) -> str:
        """Collect and validate Ethereum wallet address."""
        print("\nIMPORTANT: Please provide your Ethereum wallet address.")
        print("This address will receive an NFT signifying completion of the consultation.")
        print("Please double-check your address as this cannot be changed later.")
        
        while True:
            address = input("\nEthereum wallet address: ")
            if self.w3.is_address(address):
                return address
            print("Invalid Ethereum address. Please try again.")

    def setup_nft_contract(self):
        """Setup NFT contract connection."""
        contract_address = os.getenv("NFT_CONTRACT_ADDRESS")
        abi = json.loads(os.getenv("NFT_CONTRACT_ABI"))
        return self.w3.eth.contract(address=contract_address, abi=abi)

    async def mint_nft(self, recipient_address: str):
        """Mint NFT to recipient using AgentKit."""
        try:
            logger.info(f"Minting NFT to {recipient_address}")
            
            # Use AgentKit for minting
            mint_result = await self.agent_kit.mint_nft(
                contract_address=os.getenv("NFT_CONTRACT_ADDRESS"),
                recipient_address=recipient_address,
                token_uri="ipfs://your-token-uri"  # Replace with actual token URI
            )
            
            logger.info(f"NFT minted successfully. Transaction hash: {mint_result['transaction_hash']}")
            
        except Exception as e:
            logger.error(f"Error minting NFT: {e}")
            raise

    def generate_summary(self) -> Dict[str, Any]:
      """Generate consultation summary using LLM analysis."""
      
      # Format conversation history for LLM
      formatted_history = []
      for item in self.conversation_history:
          formatted_history.append(f"Question: {item['question']}\nResponse: {item['response']}")
      
      conversation_text = "\n\n".join(formatted_history)
      
      # Create prompt for LLM
      prompt = f"""
      Below is a medical consultation conversation. The collected data includes:
      1. Symptoms and their duration
      2. Medical history
      3. Current medications
      4. Diagnosis
      5. Treatment plan

      Conversation:
      {conversation_text}

      Please generate a concise summary of the collected data from this conversation.
      Format your response as JSON with the following structure:
      {{
          "diagnosis": "primary diagnosis",
          "prescription": {{
              "medications": [],
              "tests": [],
              "follow_up": [],
              "advice": []
          }},
          "symptoms": [
              {{
                  "name": "symptom name",
                  "duration": "duration description",
                  "severity": "mild/moderate/severe"
              }}
          ],
          "medical_history": "medical history description",
          "timestamp": "timestamp of consultation"
      }}
      """
      
      try:
          # Get LLM analysis
          response = asyncio.run(self.llm.ainvoke(prompt))
          summary = json.loads(response)
          
          # Add metadata
          summary["consultation_metadata"] = {
              "total_questions": len(self.conversation_history),
              "completion_time": datetime.now().isoformat(),
              "website_knowledge": list(self.website_knowledge.keys())
          }
          
          return summary
          
      except Exception as e:
          logger.error(f"Error generating summary: {e}")
          return {
              "error": "Failed to generate summary",
              "timestamp": datetime.now().isoformat()
          }

    async def analyze_medical_history(self, response: str) -> List[dict]:
        """Analyze and structure medical history from patient response."""
        prompt = f"""
        Patient reported: {response}
        Extract and structure their medical history in JSON format:
        {{
            "medical_history": [
                {{
                    "condition": "condition name",
                    "duration": "time since diagnosis",
                    "treatment": "current treatment (if any)"
                }}
            ],
            "allergies": ["list of allergies"],
            "family_history": "relevant family medical history"
        }}
        """
        result = await self.llm.ainvoke(prompt)
        try:
            structured_data = json.loads(result.text())
            self.medical_history.extend(structured_data["medical_history"])
            return structured_data
        except json.JSONDecodeError:
            logger.error("Failed to parse medical history")
            return {}

    async def identify_medications(self, response: str) -> List[dict]:
        """Identify current medications from patient response."""
        prompt = f"""
        Patient reported: {response}
        List current medications and supplements in JSON format:
        {{
            "medications": [
                {{
                    "name": "medication name",
                    "dosage": "current dosage",
                    "frequency": "daily/weekly/etc"
                }}
            ]
        }}
        """
        result = await self.llm.ainvoke(prompt)
        try:
            return json.loads(result.text())["medications"]
        except json.JSONDecodeError:
            logger.error("Failed to parse medications")
            return []

    async def update_assessment(self, response: str):
        """Update medical assessment with additional insights from new information."""
        try:
            # Analyze and refine the symptom profile with follow-up responses
            new_symptoms = await self.analyze_symptoms(response)
            if new_symptoms:
                for symptom in new_symptoms:
                    # Avoid duplicate entries by checking existing symptoms
                    if symptom not in self.current_symptoms:
                        self.current_symptoms.append(symptom)
            
            # Assess and merge any updates to the medical history
            history_update = await self.analyze_medical_history(response)
            if history_update and history_update.get("medical_history"):
                for item in history_update["medical_history"]:
                    if item not in self.medical_history:
                        self.medical_history.append(item)
                        
            # Optionally, trigger differential diagnosis update if conditions meet
            # self.update_differential_diagnosis(self.current_symptoms, self.medical_history)
            
        except Exception as e:
            logger.error(f"Error updating assessment: {e}")
            # Proceed with consultation notwithstanding the error

    async def process_voice_input(self, text: str) -> str:
        """Process voice input from phone call and return spoken response"""
        # Initialize conversation state if first call
        if not hasattr(self, 'call_state'):
            self.call_state = 'greeting'
            self.demographics = {}
            self.call_history = []

        # Record input
        self.call_history.append({"user": text, "timestamp": datetime.now().isoformat()})

        # Process based on current state
        if self.call_state == 'greeting':
            # First, ask for demographics
            response = "Hello, I'm your pulse healthcare assistant. Could you please tell me your name, age, and biological sex?"
            self.call_state = 'demographics'

        elif self.call_state == 'demographics':
            # Process demographics
            try:
                # Extract demographics from text
                prompt = f"""
                Extract the following information from the patient's response:
                Patient response: {text}

                Format as JSON:
                {{
                  "name": "patient name",
                  "age": "patient age as number",
                  "sex": "biological sex (male/female)"
                }}
                """
                result = await self.llm.ainvoke(prompt)
                self.demographics = json.loads(result.text())

                # Now that we have demographics, ask what brings them here
                response = f"Thank you {self.demographics.get('name', 'there')}. What brings you here today?"
                self.call_state = 'chief_complaint'
            except:
                # Retry demographics
                response = "I didn't quite catch that. Could you please tell me your name, age, and biological sex?"

        elif self.call_state == 'chief_complaint':
            # Process initial complaint
            self.chief_complaint = text
            # Ask for specific symptoms and duration
            response = "Could you please describe your symptoms in detail and tell me how long you've been experiencing them?"
            self.call_state = 'symptoms'

        elif self.call_state == 'symptoms':
            # Process symptoms
            self.symptoms = text
            response = "I understand. Do you have any relevant medical history I should know about?"
            self.call_state = 'medical_history'

        elif self.call_state == 'medical_history':
            # Process medical history
            self.medical_history = text
            response = "Are you currently taking any medications?"
            self.call_state = 'medications'

        elif self.call_state == 'medications':
            # Process medications
            self.medications = text

            # Generate assessment
            prompt = f"""
            Based on the following patient information, provide a brief assessment and recommendation:

            Demographics: {self.demographics}
            Symptoms: {self.symptoms}
            Medical History: {self.medical_history}
            Medications: {self.medications}

            Keep your response conversational and under 200 words.
            """
            result = await self.llm.ainvoke(prompt)
            assessment = result.text()

            # Final response, allow user to continue or finish
            response = f"Based on what you've told me, {assessment} Is there anything else you'd like to discuss?"
            self.call_state = 'followup'

        elif self.call_state == 'followup':
            # If user says they're done, end the call
            if any(word in text.lower() for word in ['no', 'nothing', "that's all", 'goodbye']):
                response = "Thank you for calling. Take care and have a good day."
                self.call_state = 'end'
            else:
                # Generate contextual response to follow-up
                prompt = f"""
                Patient has additional question or concern: {text}

                Previous conversation:
                Demographics: {self.demographics}
                Symptoms: {self.symptoms}
                Medical History: {self.medical_history}
                Medications: {self.medications}

                Provide a helpful, brief response addressing their concern.
                """
                result = await self.llm.ainvoke(prompt)
                response = f"{result.text()} Is there anything else I can help with?"

        else:
            # Default response
            response = "Thank you for calling. Is there anything else I can help with?"

        # Record response
        self.call_history.append({"doctor": response, "timestamp": datetime.now().isoformat()})
        return response

    async def save_phone_consultation(self):
        """Save the phone consultation to a JSON file"""
        # Create consultations directory if it doesn't exist
        os.makedirs('consultations', exist_ok=True)
        
        # Generate a unique filename with timestamp and patient name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        patient_name = self.demographics.get('name', 'unknown').replace(' ', '_').lower()
        filename = f"consultations/phone_consultation_{patient_name}_{timestamp}.json"
        
        # Prepare consultation data
        consultation_data = {
            "patient": self.demographics,
            "consultation_date": datetime.now().isoformat(),
            "symptoms": self.symptoms,
            "medical_history": self.medical_history,
            "medications": self.medications,
            "conversation_history": self.call_history,
            "call_duration": (datetime.now() - datetime.fromisoformat(self.call_history[0]["timestamp"])).total_seconds()
        }
        
        # Save to file
        with open(filename, 'w') as f:
            json.dump(consultation_data, f, indent=2)
        
        return filename

async def main():
    # Load character configuration
    with open("characters/interviewer.json", "r") as f:
        character_config = json.load(f)

    # Check if voice mode is enabled
    voice_enabled = os.getenv("VOICE_ENABLED", "false").lower() == "true"
    if voice_enabled:
        print("Voice mode ENABLED - you can speak responses and hear questions")
        # print("Make sure you have the required packages: pip install openai sounddevice soundfile numpy")
        # Check for OPENAI_API_KEY
        if not os.getenv("OPENAI_API_KEY"):
            print("WARNING: OPENAI_API_KEY not found in environment variables")
            print("Voice features require an OpenAI API key")
            print("Add OPENAI_API_KEY to your .env file or set it in your environment")

    # Initialize agent
    agent = DoctorPatientAgent(character_config)
    print("Agent initialized successfully!")

    await agent.conduct_consultation()

if __name__ == "__main__":
    asyncio.run(main())