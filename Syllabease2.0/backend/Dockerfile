# Use lightweight Python 3.12 image
FROM python:3.12-slim

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        # Headless LibreOffice for DOCX -> PDF
        libreoffice-core \
        libreoffice-common \
        libreoffice-writer \
        fonts-dejavu \
        # Build tools for Python packages
        build-essential \
        pkg-config \
        # MySQL dev headers
        default-libmysqlclient-dev \
        # Libraries for lxml and Pillow
        libxml2-dev \
        libxslt1-dev \
        zlib1g-dev \
        libjpeg-dev \
        libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (Docker cache)
COPY requirements.txt .

# Upgrade pip and install Python packages
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the Django port
EXPOSE 8000

# Start Django with gunicorn-
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
