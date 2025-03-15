import json
import os
from datetime import datetime
from typing import Dict, Any, List

class MedicalFormGenerator:
    def __init__(self, consultation_file_path: str):
        self.consultation_data = self._load_consultation_data(consultation_file_path)
        
    def _load_consultation_data(self, file_path: str) -> Dict[str, Any]:
        """Load and parse the consultation JSON file."""
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def generate_patient_registration_form(self) -> Dict[str, Any]:
        """Generate patient registration form data with specific required fields."""
        return {
            "form_type": "Patient Registration",
            "timestamp": self.consultation_data["timestamp"],
            "required_information": {
                "personal_info": {
                    "full_name": "",
                    "date_of_birth": "",
                    "gender": "",
                    "marital_status": ""
                },
                "contact_info": {
                    "current_address": "",
                    "phone_number": "",
                    "email_address": "",
                    "ssn": "",
                    "government_id": ""
                },
                "emergency_contact": {
                    "name": "",
                    "relationship": "",
                    "phone_number": ""
                },
                "demographics": {
                    "race": "",
                    "ethnicity": "",
                    "preferred_language": ""
                },
                "provider_info": {
                    "primary_care_provider": "",
                    "previous_provider": ""
                }
            },
            "status": "Pending completion",
            "form_id": f"REG_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
    
    def generate_medical_history_form(self) -> Dict[str, Any]:
        """Generate medical history form with specified fields."""
        medical_history = self.consultation_data.get("medical_history", {})
        symptoms = self.consultation_data.get("symptoms", [])
        
        return {
            "form_type": "Medical History",
            "timestamp": self.consultation_data["timestamp"],
            "current_conditions": {
                "primary_diagnosis": self.consultation_data.get("diagnosis"),
                "chronic_illnesses": [],
                "ongoing_symptoms": [
                    {
                        "name": symptom["name"],
                        "duration": symptom["duration"],
                        "severity": symptom["severity"]
                    }
                    for symptom in symptoms
                ]
            },
            "past_medical_history": {
                "illnesses": medical_history.get("medical_history", []),
                "surgeries": [],
                "hospitalizations": [],
                "significant_events": []
            },
            "medications": {
                "prescription": [
                    {
                        "name": med["name"],
                        "dosage": med["dosage"],
                        "frequency": med["dosage"].split()[-2],
                        "purpose": med["purpose"]
                    }
                    for med in self.consultation_data.get("prescription", {}).get("medications", [])
                ],
                "over_the_counter": [],
                "supplements": []
            },
            "allergies": {
                "medications": medical_history.get("allergies", []),
                "foods": [],
                "environmental": [],
                "previous_reactions": []
            },
            "immunization_history": {
                "vaccines": [],
                "dates": []
            },
            "family_medical_history": {
                "hereditary_conditions": [],
                "genetic_predispositions": [],
                "general": medical_history.get("family_history", "Not provided")
            },
            "form_id": f"MH_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
    
    def generate_consent_form(self) -> Dict[str, Any]:
        """Generate consent form with verbal consent confirmation."""
        return {
            "form_type": "Consent for Treatment",
            "timestamp": self.consultation_data["timestamp"],
            "verbal_consent": {
                "given": False,
                "datetime": "",
                "witness": ""
            },
            "treatment_details": {
                "diagnosis": self.consultation_data.get("diagnosis"),
                "proposed_treatments": [
                    {
                        "treatment": med["name"],
                        "purpose": med["purpose"],
                        "potential_risks": "",
                        "benefits": ""
                    }
                    for med in self.consultation_data.get("prescription", {}).get("medications", [])
                ],
                "procedures": self.consultation_data.get("prescription", {}).get("tests", [])
            },
            "emergency_authorization": {
                "authorized": False,
                "limitations": ""
            },
            "confirmation": {
                "patient_name": "",
                "signature": "",
                "date": "",
                "witness_signature": ""
            },
            "form_id": f"CONS_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
    
    def generate_hipaa_form(self) -> Dict[str, Any]:
        """Generate HIPAA acknowledgment form."""
        return {
            "form_type": "HIPAA Privacy Acknowledgment",
            "timestamp": self.consultation_data["timestamp"],
            "verbal_acknowledgment": {
                "given": False,
                "datetime": "",
                "witness": ""
            },
            "privacy_practices": {
                "information_usage": {
                    "purpose": "Treatment, payment, and healthcare operations",
                    "sharing_policy": "Information shared only with authorized healthcare providers and as required by law"
                },
                "patient_rights": {
                    "access_rights": "Right to access and obtain copies of medical records",
                    "amendment_rights": "Right to request amendments to medical records",
                    "restriction_rights": "Right to request restrictions on information sharing"
                },
                "safeguards": {
                    "technical": "Electronic health record security",
                    "physical": "Secure storage of paper records",
                    "administrative": "Staff training and privacy policies"
                }
            },
            "acknowledgment": {
                "patient_name": "",
                "signature": "",
                "date": "",
                "witness_signature": ""
            },
            "form_id": f"HIPAA_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
    
    def generate_insurance_form(self) -> Dict[str, Any]:
        """Generate insurance information form."""
        return {
            "form_type": "Insurance Information",
            "timestamp": self.consultation_data["timestamp"],
            "insurance_details": {
                "company_name": "",
                "policy_number": "",
                "group_number": ""
            },
            "policyholder_info": {
                "name": "",
                "relationship_to_patient": "",
                "employer": ""
            },
            "insurance_contact": {
                "billing_address": "",
                "phone_number": "",
                "email": ""
            },
            "employer_plan": {
                "is_employer_sponsored": False,
                "employer_name": "",
                "group_plan_details": ""
            },
            "authorization": {
                "pre_auth_required": False,
                "pre_auth_number": "",
                "referral_required": False,
                "referral_details": ""
            },
            "form_id": f"INS_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }
    
    def save_individual_form(self, form_data: Dict[str, Any], output_path: str, form_type: str) -> None:
        """Save an individual form to a JSON file."""
        timestamp = self.consultation_data["timestamp"].replace(":", "-")
        filename = f"{form_type.lower()}_{timestamp}.json"
        output_file = os.path.join(output_path, filename)
        
        with open(output_file, 'w') as f:
            json.dump(form_data, f, indent=2)
        print(f"Generated {form_type} form: {filename}")
    
    def generate_and_save_all_forms(self, output_path: str) -> None:
        """Generate and save all forms as separate JSON files."""
        # Create forms
        registration = self.generate_patient_registration_form()
        medical_history = self.generate_medical_history_form()
        consent = self.generate_consent_form()
        hipaa = self.generate_hipaa_form()
        insurance = self.generate_insurance_form()
        
        # Save each form separately
        self.save_individual_form(registration, output_path, "Registration")
        self.save_individual_form(medical_history, output_path, "MedicalHistory")
        self.save_individual_form(consent, output_path, "Consent")
        self.save_individual_form(hipaa, output_path, "HIPAA")
        self.save_individual_form(insurance, output_path, "Insurance")

def main():
    # Directory containing consultation files
    consultations_dir = "consultations"
    # Directory for output forms
    forms_output_dir = "generated_forms"
    
    # Create output directory if it doesn't exist
    os.makedirs(forms_output_dir, exist_ok=True)
    
    # Process all consultation files in the directory
    for filename in os.listdir(consultations_dir):
        if filename.endswith(".json"):
            consultation_path = os.path.join(consultations_dir, filename)
            try:
                form_generator = MedicalFormGenerator(consultation_path)
                form_generator.generate_and_save_all_forms(forms_output_dir)
                print(f"Successfully processed: {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")

if __name__ == "__main__":
    main()
