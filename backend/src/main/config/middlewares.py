from flask import Flask, request, jsonify


def setup_middlewares(app: Flask):
    @app.before_request
    def log_request_info():
        app.logger.debug('Headers: %s', request.headers)
        app.logger.debug('Body: %s', request.get_data())

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(e)
        return jsonify({"error": "Internal server error"}), 500

    @app.after_request
    def add_header(response):
        response.headers['Content-Type'] = 'application/json'
        return response 