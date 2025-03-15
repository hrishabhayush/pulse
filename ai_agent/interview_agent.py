import json
import os
import asyncio
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from dotenv import load_dotenv
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
        self.administrative_data = {
            "patient_registration": {},
            "insurance": {},
            "consent": {},
            "hipaa": {}
        }
        
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
    async def learn_websites(self):
        """Learn from websites using browser agent."""
        logger.info("Learning from websites...")
        
        for url in self.config["website_knowledge"]["urls"]:
            try:
                # Create browsing task for website exploration
                task = f"""
                Visit {url} and thoroughly explore the website to understand:
                1. Main product/service offerings
                2. Key features and benefits
                3. Technical specifications
                4. Pricing information (if available)
                5. Documentation and guides
                
                Provide a comprehensive summary of the findings.
                """
                
                # Execute browser task
                result = await self.browser_tool._arun(task)
                self.website_knowledge[url] = result
                logger.info(f"Successfully explored {url}")
                
            except Exception as e:
                logger.error(f"Error exploring {url}: {e}")
                # Use fallback content if available
                self.website_knowledge[url] = self.config["website_knowledge"].get(
                    "fallback_content", {}).get("description", "")
        
        logger.info("Website learning completed")

    async def yn_vagueness(self, response: str, question_context: str) -> Dict[str, str]:
        """Analyze if response is vague."""
        prompt = f"""
        Question asked: {question_context}
        User response: {response}

        Is this response vague? 
        Return your answer as a yes or no answer
        """
        llm_response = await self.llm.ainvoke(prompt)
        return llm_response.text()
    

    async def yn_difference(self, response: str, question_context: str) -> Dict[str, str]:
        """Analyze if response differs from product knowledge."""
        prompt = f"""
        Question asked: {question_context}
        User response: {response}

        Does this response differ from what you know about {self.config['name']}?
        Return your answer as a yes or no answer
        """
        llm_response = await self.llm.ainvoke(prompt)
        return llm_response.text()

    async def yn_features(self, response: str, product: str) -> Dict[str, str]:
        """Analyze features mentioned in response."""
        prompt = f"""
        User response: {response}
        Using my knowledge of {product},
        are there any features on {product} that are commonly used alongside any features mentioned in this response?
        Return your answer as a yes or no answer
        """
        llm_response = await self.llm.ainvoke(prompt)
        return llm_response.text()

    async def yn_continue(self, response: str, question_context: str) -> Dict[str, str]:
        """Determine if conversation should continue."""
        prompt = f"""
        Question asked: {question_context}
        User response: {response}

        Would continuing this line of conversation yield more insights about product-market fit?
        Return your answer as a yes or no answer
        """
        llm_response = await self.llm.ainvoke(prompt)
        return llm_response.text()

    async def followup_vagueness(self, response: str, question_context: str) -> str:
        """Generate a follow-up question based on LLM analysis."""
        prompt = f"""
        Question asked: {question_context}
        User response: {response}

        Given this question and answer, what follow-up question should I ask to understand the user's perspective better?
        The follow-up should help clarify their response and gather more specific details.
        
        Return only the follow-up question, without any additional explanation or formatting.
        """
        
        follow_up = await self.llm.ainvoke(prompt)
        return follow_up.text().strip()

    async def followup_differences(self, response: str, question_context: str) -> str:
        """Generate a follow-up question for unexpected responses."""
        prompt = f"""
        Question asked: {question_context}
        User response: {response}

        Given this response differs from typical product usage patterns, what follow-up question should I ask to better understand their unique perspective?
        The follow-up should explore their reasoning and specific use case.
        
        Return only the follow-up question, without any additional explanation or formatting.
        """
        
        follow_up = await self.llm.ainvoke(prompt)
        return follow_up.text().strip()

    async def feature_connections(self, response: str, product: str) -> str:
        """Ask LLM about related features."""
        prompt = f"""
        Based on this response: "{response}" by the user, look at the my knowledge of {product} and what
        features do this type user typically use alongside with on {product}?
        Explain why these combinations are valuable.
        Answer in a concise paragraph, keep in mind the user's demographic hinted from the response
        """
        response=await self.llm.ainvoke(prompt)
        return response.text()

    async def collect_patient_registration_info(self) -> Dict[str, Any]:
        """Collect patient registration information."""
        print("\n=== Patient Registration Information ===")
        registration_data = {}
        
        # Personal Information
        print("\nPersonal Information:")
        registration_data["personal_info"] = {
            "full_name": await self.ask_question("What is your full name?"),
            "date_of_birth": await self.ask_question("What is your date of birth? (MM/DD/YYYY)"),
            "gender": await self.ask_question("What is your gender?"),
            "marital_status": await self.ask_question("What is your marital status?")
        }
        
        # Contact Information
        print("\nContact Information:")
        registration_data["contact_info"] = {
            "current_address": await self.ask_question("What is your current address?"),
            "phone_number": await self.ask_question("What is your phone number?"),
            "email_address": await self.ask_question("What is your email address?"),
            "ssn": await self.ask_question("What are the last 4 digits of your Social Security Number? (Optional)"),
            "government_id": await self.ask_question("Do you have any other form of government-issued ID? If yes, please provide the type and last 4 digits. (Optional)")
        }
        
        # Emergency Contact
        print("\nEmergency Contact:")
        registration_data["emergency_contact"] = {
            "name": await self.ask_question("Who should we contact in case of emergency? (Full name)"),
            "relationship": await self.ask_question("What is their relationship to you?"),
            "phone_number": await self.ask_question("What is their phone number?")
        }
        
        # Demographics
        print("\nDemographic Information:")
        registration_data["demographics"] = {
            "race": await self.ask_question("What is your race? (Optional)"),
            "ethnicity": await self.ask_question("What is your ethnicity? (Optional)"),
            "preferred_language": await self.ask_question("What is your preferred language?")
        }
        
        # Provider Information
        print("\nProvider Information:")
        registration_data["provider_info"] = {
            "primary_care_provider": await self.ask_question("Who is your primary care provider? (If any)"),
            "previous_provider": await self.ask_question("Who was your previous healthcare provider? (If different)")
        }
        
        self.administrative_data["patient_registration"] = registration_data
        return registration_data

    async def collect_insurance_information(self) -> Dict[str, Any]:
        """Collect insurance information."""
        print("\n=== Insurance Information ===")
        insurance_data = {}
        
        # Insurance Details
        print("\nInsurance Details:")
        insurance_data["insurance_details"] = {
            "company_name": await self.ask_question("What is the name of your insurance company?"),
            "policy_number": await self.ask_question("What is your policy number?"),
            "group_number": await self.ask_question("What is your group number? (If applicable)")
        }
        
        # Policyholder Information
        print("\nPolicyholder Information:")
        insurance_data["policyholder_info"] = {
            "name": await self.ask_question("Who is the primary policyholder?"),
            "relationship_to_patient": await self.ask_question("What is your relationship to the policyholder? (If different from self)"),
            "employer": await self.ask_question("What is the policyholder's employer? (If employer-sponsored)")
        }
        
        # Insurance Contact
        insurance_data["insurance_contact"] = {
            "billing_address": await self.ask_question("What is the billing address for your insurance?"),
            "phone_number": await self.ask_question("What is the insurance company's contact phone number?")
        }
        
        # Authorization Information
        insurance_data["authorization"] = {
            "pre_auth_required": await self.ask_question("Does your insurance require pre-authorization for visits? (Yes/No)"),
            "referral_required": await self.ask_question("Does your insurance require referrals for specialist visits? (Yes/No)")
        }
        
        self.administrative_data["insurance"] = insurance_data
        return insurance_data

    async def collect_treatment_consent(self) -> Dict[str, Any]:
        """Collect informed consent for treatment."""
        print("\n=== Consent for Treatment ===")
        
        # Explain treatment details
        consent_explanation = f"""
        Based on our consultation, you have been diagnosed with: {self.prescription.get('diagnosis', 'pending diagnosis')}
        
        Proposed treatment plan includes:
        1. Medications:
        {self._format_medications(self.prescription.get('prescription', {}).get('medications', []))}
        
        2. Recommended tests:
        {self._format_list(self.prescription.get('prescription', {}).get('tests', []))}
        
        3. Follow-up care:
        {self._format_list(self.prescription.get('prescription', {}).get('follow_up', []))}
        
        Potential risks and benefits have been explained. Emergency care will be provided if needed.
        """
        
        print(consent_explanation)
        if self.voice_enabled and self.voice_llm:
            await self.speak_text(consent_explanation)
        
        consent_data = {
            "verbal_consent": {
                "given": await self.ask_question("Do you understand and consent to this treatment plan? (Yes/No)"),
                "datetime": datetime.now().isoformat(),
                "witness": "AI Medical Assistant"
            },
            "emergency_authorization": {
                "authorized": await self.ask_question("Do you authorize emergency treatment if needed? (Yes/No)"),
                "limitations": await self.ask_question("Are there any limitations to your consent for emergency treatment?")
            }
        }
        
        self.administrative_data["consent"] = consent_data
        return consent_data

    async def collect_hipaa_acknowledgment(self) -> Dict[str, Any]:
        """Collect HIPAA privacy acknowledgment."""
        print("\n=== HIPAA Privacy Practices Acknowledgment ===")
        
        # Explain HIPAA privacy practices
        hipaa_explanation = """
        HIPAA Privacy Practices Overview:
        
        1. Use of Your Information:
           - For treatment, payment, and healthcare operations
           - Shared only with authorized healthcare providers
           - Used for care coordination and quality improvement
        
        2. Your Rights:
           - Access and obtain copies of your medical records
           - Request amendments to your records
           - Receive an accounting of disclosures
           - Request restrictions on information sharing
        
        3. Our Security Measures:
           - Electronic records are encrypted and password-protected
           - Physical records are stored in secure locations
           - Staff are trained in privacy procedures
           - Regular security audits are conducted
        """
        
        print(hipaa_explanation)
        if self.voice_enabled and self.voice_llm:
            await self.speak_text(hipaa_explanation)
        
        hipaa_data = {
            "verbal_acknowledgment": {
                "given": await self.ask_question("Do you acknowledge receipt and understanding of our HIPAA privacy practices? (Yes/No)"),
                "datetime": datetime.now().isoformat(),
                "witness": "AI Medical Assistant"
            }
        }
        
        self.administrative_data["hipaa"] = hipaa_data
        return hipaa_data

    def _format_medications(self, medications: List[Dict[str, str]]) -> str:
        """Format medications list for display."""
        if not medications:
            return "No medications prescribed"
        
        formatted = []
        for med in medications:
            formatted.append(f"- {med.get('name', 'Unknown')}: {med.get('dosage', 'Unknown dosage')}")
        return "\n".join(formatted)

    def _format_list(self, items: List[str]) -> str:
        """Format list items for display."""
        if not items:
            return "None"
        return "\n".join(f"- {item}" for item in items)

    async def conduct_consultation(self):
        """Conduct the medical consultation process."""
        logger.info("Starting medical consultation...")
        
        try:
            # Collect administrative information first
            await self.collect_patient_registration_info()
            await self.collect_insurance_information()
            
            # Conduct medical consultation
            initial_assessment = await self.ask_question("Please describe your current symptoms and their duration:")
            self.current_symptoms = await self.analyze_symptoms(initial_assessment)
            
            history_response = await self.ask_question("Do you have any relevant medical history or existing conditions?")
            self.medical_history = await self.analyze_medical_history(history_response)
            
            meds_response = await self.ask_question("Are you currently taking any medications or supplements?")
            current_meds = await self.identify_medications(meds_response)
            
            # Symptom follow-up loop
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
            
            # Collect consent and acknowledgments
            await self.collect_treatment_consent()
            await self.collect_hipaa_acknowledgment()
            
            # Save all consultation data
            await self.save_consultation()
            
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
        """Generate context-aware medical follow-up question."""
        prompt = f"""
        Based on this patient data:
        Symptoms: {self.current_symptoms}
        History: {self.medical_history}
        
        What is the most important follow-up question to ask?
        Consider:
        - Symptom clarification
        - Risk factors
        - Pain characteristics
        - Associated symptoms
        
        Return only the question with no additional text.
        
        Example response:
        Can you describe the quality of your headache? Is it throbbing, sharp, or dull?
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
        """Save medical consultation data including administrative forms."""
        data = {
            "diagnosis": self.prescription["diagnosis"],
            "prescription": self.prescription["prescription"],
            "symptoms": self.current_symptoms,
            "medical_history": self.medical_history,
            "administrative_data": self.administrative_data,
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
        """Update medical assessment with new information."""
        try:
            # Analyze symptoms from follow-up response
            new_symptoms = await self.analyze_symptoms(response)
            if new_symptoms:  # Only extend if we got valid symptoms
                self.current_symptoms.extend(new_symptoms)
            
            # Check for new medical history mentions
            history_update = await self.analyze_medical_history(response)
            if history_update and history_update.get("medical_history"):
                self.medical_history.extend(history_update["medical_history"])
                
        except Exception as e:
            logger.error(f"Error updating assessment: {e}")
            # Continue consultation despite error

async def main():
    # Load character configuration
    print("Fetching character configuration...")
    with open("characters/interviewer.json", "r") as f:
        character_config = json.load(f)
    print("Character configurations fetched successfully!")
    
    # Check if voice mode is enabled
    voice_enabled = os.getenv("VOICE_ENABLED", "false").lower() == "true"
    if voice_enabled:
        print("Voice mode ENABLED - you can speak responses and hear questions")
        print("Make sure you have the required packages: pip install openai sounddevice soundfile numpy")
        # Check for OPENAI_API_KEY
        if not os.getenv("OPENAI_API_KEY"):
            print("WARNING: OPENAI_API_KEY not found in environment variables")
            print("Voice features require an OpenAI API key")
            print("Add OPENAI_API_KEY to your .env file or set it in your environment")

    # Initialize agent
    print("Initializing agent...")
    agent = DoctorPatientAgent(character_config)
    print("Agent initialized successfully!")
    
    # Learn from websites
    #print("Learning from websites...")
    #await agent.learn_websites()
    #print("Websites learned successfully!")
    # Conduct consultation
    await agent.conduct_consultation()

if __name__ == "__main__":
    asyncio.run(main())