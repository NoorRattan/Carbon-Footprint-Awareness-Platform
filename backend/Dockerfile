FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies (copy requirements first to leverage layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create non-root user for security (uid 1001)
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Run passes PORT via environment variable
ENV PORT=8080
EXPOSE 8080

# Use uvicorn with standard extras (websockets, httptools)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
