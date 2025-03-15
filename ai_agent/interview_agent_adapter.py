import importlib.util
import sys
import os

# Update import for renamed class
spec = importlib.util.spec_from_file_location(
    "doctor_patient_agent",  # Updated module name
    os.path.join(os.path.dirname(__file__), "interview-agent.py")
)
doctor_patient_agent_module = importlib.util.module_from_spec(spec)
sys.modules["doctor_patient_agent"] = doctor_patient_agent_module
spec.loader.exec_module(doctor_patient_agent_module)
DoctorPatientAgent = doctor_patient_agent_module.DoctorPatientAgent  # Updated class name

class MedicalConsultationAdapter:  # Renamed class
    """
    Adapter for doctor-patient medical consultations
    Manages the consultation flow and patient interaction
    """
    
    def __init__(self):
        self.agent = None
        self.consultation_data = {  # Changed structure
            "symptoms": [],
            "history": [],
            "prescription": None,
            "conversation": []
        }
        
    def start_consultation(self):  # Renamed method
        """
        Initialize a new medical consultation
        Returns first question from the doctor agent
        """
        self.agent = DoctorPatientAgent()  # Updated class
        
        # Get opening question
        opening_question = self.agent.get_opening_question()
        
        # Record in conversation
        self.consultation_data["conversation"].append({
            "role": "doctor",
            "content": opening_question
        })
        
        return opening_question
        
    def process_patient_response(self, response):  # Renamed method
        """
        Process patient's response and return doctor's next action
        """
        if not self.agent:
            return self.start_consultation()
            
        # Store patient response
        self.consultation_data["conversation"].append({
            "role": "patient",
            "content": response
        })
        
        # Get medical follow-up or prescription
        doctor_response = self.agent.process_medical_response(  # Updated method name
            response,
            self.consultation_data
        )
        
        # Handle final prescription
        if isinstance(doctor_response, dict) and "prescription" in doctor_response:
            self.consultation_data["prescription"] = doctor_response
            return None  # End of consultation
            
        # Store and return doctor's question
        self.consultation_data["conversation"].append({
            "role": "doctor",
            "content": doctor_response
        })
        
        return doctor_response
        
    def finalize_consultation(self):  # Renamed method
        """
        Conclude the consultation and return structured results
        """
        if not self.agent:
            return {"error": "No active consultation"}
            
        # Generate final medical summary
        summary = {
            "diagnosis": self.consultation_data.get("diagnosis", ""),
            "prescription": self.consultation_data["prescription"],
            "conversation_summary": self.agent.generate_medical_summary()
        }
        
        # Reset state
        self.agent = None
        self.consultation_data = {
            "symptoms": [],
            "history": [],
            "prescription": None,
            "conversation": []
        }
        
        return summary

