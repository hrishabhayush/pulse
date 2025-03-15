from aiohttp import web
from .phone_handler import PhoneCallManager
from .interview_agent import DoctorPatientAgent
import json

async def init_app():
    app = web.Application()
    agent = DoctorPatientAgent.load_from_config("characters/doctor.json")
    phone_manager = PhoneCallManager(agent)
    
    app.router.add_post('/call', phone_manager.handle_incoming_call)
    app.router.add_post('/stream/{stream_sid}', phone_manager.handle_media)
    
    return app

if __name__ == '__main__':
    web.run_app(init_app(), port=8080)