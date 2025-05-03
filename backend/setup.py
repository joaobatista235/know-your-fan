from setuptools import setup, find_packages

setup(
    name="know-your-fan",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "flask==2.3.3",
        "flask-cors==4.0.0",
        "pytest==7.4.0",
        "python-dotenv==1.0.0",
        "pydantic==2.3.0",
        "firebase-admin==6.2.0",
        "python-jose==3.3.0",
        "requests==2.31.0",
        "pillow==10.0.0"
    ],
) 