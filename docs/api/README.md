# MerajutASA API Documentation

Developer guide for integrating with MerajutASA governance and integrity services.

## Core Services

### Signer Service

**Endpoint:** `http://localhost:4601` (default)

#### POST /sign
Sign data with Ed25519 key.

```bash
curl -X POST http://localhost:4601/sign \
  -H "Content-Type: application/json" \
  -d '{"data": "message to sign"}'
```

**Response:**
```json
{
  "signature": "base64-encoded-signature",
  "public_key": "base64-encoded-public-key",
  "algorithm": "Ed25519"
}
```

#### POST /rotate
Rotate signing key (authorized operations only).

```bash
curl -X POST http://localhost:4601/rotate
```

### Chain Service  

**Endpoint:** `http://localhost:4602` (default)

#### POST /append
Append new entry to hash chain.

```bash
curl -X POST http://localhost:4602/append \
  -H "Content-Type: application/json" \
  -d '{
    "content": {"type": "credential", "data": "..."},
    "prev_hash": "previous-entry-hash"
  }'
```

**Response:**
```json
{
  "seq": 123,
  "content_hash": "sha256-hash",
  "prev_hash": "previous-hash",
  "signature": "signature-of-entry"
}
```

#### GET /chain
Retrieve chain entries.

```bash
# Get latest 10 entries
curl http://localhost:4602/chain?limit=10

# Get entries from specific sequence
curl http://localhost:4602/chain?from_seq=100&limit=50
```

### Event Collector

**Endpoint:** `http://localhost:4603` (default)

#### POST /ingest
Ingest event data for analysis.

```bash
curl -X POST http://localhost:4603/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "credential_issued",
    "occurred_at": "2025-08-16T15:30:00Z",
    "meta": {
      "issuer": "organization-id",
      "category": "professional"
    }
  }'
```

**Response:**
```json
{
  "status": "accepted",
  "event_id": "unique-event-id",
  "validation": "passed"
}
```

## Command Line Tools

### Governance Verification

```bash
# Complete governance check
npm run governance:verify

# Individual components
npm run spec-hash:verify    # Hash integrity
npm run param:integrity     # Parameter consistency  
npm run dec:lint           # Decision document validation
```

### Testing

```bash
# Core governance tests
npm run test:governance

# Service integration tests  
npm run test:services

# Complete test suite
npm run test:all
```

### Evidence Management

```bash
# Generate evidence bundle
npm run evidence:bundle

# Validate evidence artifacts
npm run evidence:validate

# Check for hash collisions
npm run evidence:collision
```

## Data Schemas

### Credential Schema

```json
{
  "type": "object",
  "properties": {
    "id": {"type": "string"},
    "holder": {
      "name": {"type": "string"},
      "organization": {"type": "string"}
    },
    "skills": {
      "type": "array",
      "items": {"type": "string"}
    },
    "issued_at": {"type": "string", "format": "date-time"},
    "signature": {"type": "string"}
  },
  "required": ["id", "holder", "skills", "issued_at", "signature"]
}
```

### Event Schema

```json
{
  "type": "object", 
  "properties": {
    "event_name": {"type": "string"},
    "occurred_at": {"type": "string", "format": "date-time"},
    "received_at": {"type": "string", "format": "date-time"},
    "meta": {"type": "object"}
  },
  "required": ["event_name", "occurred_at"]
}
```

## Error Handling

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid data format)
- `401` - Unauthorized (invalid credentials)
- `409` - Conflict (hash chain integrity violation)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Event schema validation failed",
    "details": {
      "field": "occurred_at",
      "issue": "Invalid date format"
    }
  }
}
```

## Integration Examples

### Node.js Integration

```javascript
import fetch from 'node-fetch';

// Sign data
async function signData(data) {
  const response = await fetch('http://localhost:4601/sign', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({data})
  });
  return response.json();
}

// Append to chain
async function appendToChain(content, prevHash) {
  const response = await fetch('http://localhost:4602/append', {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({content, prev_hash: prevHash})
  });
  return response.json();
}

// Send event
async function sendEvent(eventName, meta = {}) {
  const event = {
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    meta
  };
  
  const response = await fetch('http://localhost:4603/ingest', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(event)
  });
  return response.json();
}
```

### Python Integration

```python
import requests
import json
from datetime import datetime

def sign_data(data, base_url="http://localhost:4601"):
    response = requests.post(f"{base_url}/sign", 
                           json={"data": data})
    return response.json()

def append_to_chain(content, prev_hash, base_url="http://localhost:4602"):
    payload = {
        "content": content,
        "prev_hash": prev_hash
    }
    response = requests.post(f"{base_url}/append", json=payload)
    return response.json()

def send_event(event_name, meta=None, base_url="http://localhost:4603"):
    if meta is None:
        meta = {}
    
    event = {
        "event_name": event_name,
        "occurred_at": datetime.utcnow().isoformat() + "Z",
        "meta": meta
    }
    
    response = requests.post(f"{base_url}/ingest", json=event)
    return response.json()
```

## Configuration

### Environment Variables

- `SIGNER_PORT` - Signer service port (default: 4601)
- `CHAIN_PORT` - Chain service port (default: 4602)  
- `COLLECTOR_PORT` - Event collector port (default: 4603)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `STORAGE_PATH` - Data storage directory

### Service Configuration Files

Services read configuration from:
- `config/signer.yml`
- `config/chain.yml` 
- `config/collector.yml`

## Security

### Authentication

Currently services use basic port-based access control. Production deployments should add:
- API key authentication
- Rate limiting
- IP allowlisting
- TLS encryption

### Data Validation

All inputs are validated against JSON schemas. Invalid data is rejected with detailed error messages.

### Hash Integrity

All content is cryptographically hashed. Chain entries are linked via content hashes to prevent tampering.

---

**Version:** 2.0 (Enhanced comprehensive coverage)  
**Last Updated:** 2025-08-16
