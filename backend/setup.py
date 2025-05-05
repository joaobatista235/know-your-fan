from setuptools import setup, find_packages

setup(
    name="know-your-fan-api",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "flask>=2.3.3",
        "flask-cors>=4.0.0",
        "pytest>=7.4.0",
        "python-dotenv>=1.0.0",
        "pydantic>=2.3.0",
        "firebase-admin>=6.2.0",
        "python-jose>=3.3.0",
        "requests>=2.31.0",
        "pillow>=10.0.0",
        "gunicorn>=21.2.0"
    ],
    python_requires=">=3.11",
) 