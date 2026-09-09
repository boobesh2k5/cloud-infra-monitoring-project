FROM python:3.12-slim

WORKDIR /app

COPY server.py.postgres ./server.py
COPY config.py .
COPY schema.sql .
COPY seed.sql .

RUN pip install --no-cache-dir "psycopg[binary]" prometheus-client

EXPOSE 8000

CMD ["python", "server.py"]
