from flask import Flask

from src.presentation.controllers.user_controller import setup_user_routes
from src.presentation.controllers.health_controller import setup_health_routes
from src.presentation.controllers.fan_controller import setup_fan_routes
from src.presentation.controllers.auth_controller import setup_auth_routes


def setup_routes(app: Flask):
    """Configure all application routes"""
    
    # Health check routes
    setup_health_routes(app)
    
    # Auth routes
    setup_auth_routes(app)
    
    # API routes
    setup_user_routes(app)
    
    # Fan routes
    setup_fan_routes(app) 