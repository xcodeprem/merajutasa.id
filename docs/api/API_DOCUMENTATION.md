# MerajutASA.id API Gateway

Enterprise API for MerajutASA.id governance and integrity platform

**Version:** 1.0.0

## Base URLs

- **Development:** http://localhost:8080
- **Production:** https://api.merajutasa.id

## Authentication

This API supports multiple authentication methods:

- **Bearer Token:** Include JWT token in Authorization header
- **API Key:** Include API key in X-API-Key header

## Rate Limiting

- **Global limit:** 1000 requests per 15 minutes per IP
- **Service-specific limits:** 500 requests per 15 minutes per service

## Endpoints

### GET /api/v1/signer/pubkey

**Summary:** Get signer public key

**Description:** Retrieve the public key used for digital signing

**Tags:** Signer

**Responses:**
- **200:** Public key retrieved successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### POST /api/v1/signer/sign

**Summary:** Sign a payload

**Description:** Create a digital signature for the provided payload

**Tags:** Signer

**Responses:**
- **200:** Signature created successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### POST /api/v1/chain/append

**Summary:** Append to integrity chain

**Description:** Add a new entry to the integrity chain

**Tags:** Chain

**Responses:**
- **200:** Entry appended successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### GET /api/v1/chain/head

**Summary:** Get chain head

**Description:** Retrieve the latest chain entry

**Tags:** Chain

**Responses:**
- **200:** Chain head retrieved successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### POST /api/v1/collector/ingest

**Summary:** Ingest event data

**Description:** Submit event data for processing and analysis

**Tags:** Collector

**Responses:**
- **200:** Event ingested successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### GET /health

**Summary:** Gateway health check

**Description:** Check the health status of the API gateway

**Tags:** Management

**Responses:**
- **200:** Gateway is healthy
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### GET /metrics

**Summary:** Gateway metrics

**Description:** Retrieve operational metrics from the API gateway

**Tags:** Management

**Responses:**
- **200:** Metrics retrieved successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error

### GET /services

**Summary:** List available services

**Description:** Get information about all registered microservices

**Tags:** Management

**Responses:**
- **200:** Services list retrieved successfully
- **400:** #/components/responses/Error
- **401:** #/components/responses/Unauthorized
- **429:** #/components/responses/RateLimitExceeded
- **500:** #/components/responses/Error


## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "requestId": "unique-request-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Contact

- **Team:** MerajutASA.id API Team
- **Email:** api@merajutasa.id
- **Website:** https://merajutasa.id
