from flask import Flask, jsonify
from flask_cors import CORS
import logging
from firebase_admin.exceptions import FirebaseError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global error handlers
@app.errorhandler(FirebaseError)
def handle_firebase_error(error):
    logger.error(f"Firebase error: {str(error)}")
    if "CONFIGURATION_NOT_FOUND" in str(error):
        return jsonify({"error": "Firebase configuration issue. Please check your Firebase setup."}), 500
    elif "PERMISSION_DENIED" in str(error):
        return jsonify({"error": "Permission denied. Check your Firebase rules."}), 403
    elif "NOT_FOUND" in str(error) and "database" in str(error):
        return jsonify({
            "error": "Firestore database not found. Please create a Firestore database in the Firebase console.",
            "details": "Visit https://console.cloud.google.com/firestore/setup to set up your database."
        }), 404
    else:
        return jsonify({"error": f"Firebase error: {str(error)}"}), 500

@app.errorhandler(500)
def handle_server_error(error):
    logger.error(f"Server error: {str(error)}")
    return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

# Importar rotas após a criação da app
from src.main.routes import setup_routes

# Configurar rotas
setup_routes(app)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000) 