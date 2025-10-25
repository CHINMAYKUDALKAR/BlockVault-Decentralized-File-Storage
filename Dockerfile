FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml README.md ./
# Install build deps for rust and crypto build requirements
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cargo git && rm -rf /var/lib/apt/lists/*
COPY blockvault ./blockvault
COPY blockvault_crypto ./blockvault_crypto
COPY app.py ./
RUN pip install --no-cache-dir .
# Pre-build the Rust crypto binary to avoid first-request latency
RUN cargo build --release --manifest-path blockvault_crypto/Cargo.toml || true
EXPOSE 5000
CMD ["python", "app.py"]
