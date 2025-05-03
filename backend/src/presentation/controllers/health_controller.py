from flask import Flask, jsonify
from datetime import datetime


def setup_health_routes(app: Flask):
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat()
        }), 200