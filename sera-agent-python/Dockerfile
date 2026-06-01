FROM python:3.11-slim

WORKDIR /app

# System dependencies (if any needed for numpy/pandas etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
# Ensure Google GenAI uses Vertex AI automatically on Cloud Run
ENV GOOGLE_GENAI_USE_VERTEXAI=TRUE

# Run via uvicorn (Cloud Run expects listening on PORT, which defaults to 8080. Our main.py uses os.getenv("PORT", 8000), so we can expose that)
EXPOSE 8000

CMD ["python", "main.py"]
