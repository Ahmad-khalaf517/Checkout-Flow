# API Contracts & Integration Specification

**Feature**: 001-payment-checkout-flow

**Date**: 2026-06-08

**Protocol**: HTTP/REST | **Auth**: Bearer Token (v1) | **Format**: JSON

---

## Overview

The checkout flow interacts with three API domains:

1. **Checkout API** — Order submission and payment processing
2. **Geo API** — Country/state reference data
3. **Address API** — Address validation and autocomplete

All requests use JSON payloads. All responses include standard HTTP status codes and error envelopes.

---

## 1. Checkout API

### 1.1 POST /api/orders/submit

**Purpose**: Submit checkout form data and process payment.

**Request**:
```http
POST /api/orders/submit HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer <token>
Idempotency-Key: <uuid>

{
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "14155552671"
  },
  "billingAddress": {
    "streetAddress": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "US"
  },
  "shippingAddress": {
    "streetAddress": "456 Oak Avenue",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94107",
    "country": "US"
  },
  "paymentMethod": {
    "token": "tok_visa_1234567890abcdef",  // Stripe token, NOT raw card data
    "cardholderName": "John Doe",
    "last4Digits": "4242"
  },
  "cartItems": [
    {
      "id": "SKU-001",
      "name": "Blue Widget",
      "quantity": 2,
      "price": 2999,
      "image": "https://cdn.example.com/products/blue-widget.jpg"
    }
  ],
  "cartTotal": 5998,
  "currency": "USD"
}
```

**Request Headers**:
- `Authorization: Bearer <jwt_token>` — User auth (optional for guest checkout)
- `Idempotency-Key: <uuid>` — Prevents duplicate orders on retry (required)
- `Content-Type: application/json`

**Request Validation**:
- All fields in `personalInfo` required
- All fields in `billingAddress` required
- `shippingAddress` required (same as billing if no separate address)
- `paymentMethod.token` must be valid token from Stripe/Square (not raw card)
- `cartItems` must not be empty; must match user's current cart
- `cartTotal` must be recalculated server-side; client value is trusted but verified

**Response (Success - 201)**:
```http
HTTP/1.1 201 Created
Content-Type: application/json
X-Request-ID: req_1234567890abcdef

{
  "success": true,
  "order": {
    "orderId": "ORD-1234567890",
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "14155552671"
    },
    "billingAddress": {
      "streetAddress": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "US"
    },
    "shippingAddress": {
      "streetAddress": "456 Oak Avenue",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94107",
      "country": "US"
    },
    "paymentMethod": {
      "cardType": "visa",
      "last4Digits": "4242",
      "expiryDate": "12/25"
    },
    "items": [
      {
        "id": "SKU-001",
        "name": "Blue Widget",
        "quantity": 2,
        "price": 2999,
        "subtotal": 5998
      }
    ],
    "itemsSubtotal": 5998,
    "shippingCost": 0,
    "tax": 0,
    "orderTotal": 5998,
    "currency": "USD",
    "status": "completed",
    "paymentId": "ch_1234567890abcdef",
    "createdAt": "2026-06-08T15:30:00.000Z",
    "processedAt": "2026-06-08T15:30:05.000Z"
  }
}
```

**Response (Validation Error - 400)**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields",
    "details": {
      "billingAddress.postalCode": "Postal code does not match state (expected 5-digit ZIP for CA)",
      "paymentMethod.token": "Invalid or expired token"
    }
  }
}
```

**Response (Payment Declined - 402)**:
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "Your card was declined. Please check your card details or try another card.",
    "details": {
      "declineCode": "insufficient_funds",
      "chargeId": "ch_declined_xyz"
    }
  }
}
```

**Response (Server Error - 500)**:
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred while processing your order. Please try again.",
    "requestId": "req_1234567890abcdef"
  }
}
```

**Error Codes**:

| Code | HTTP | User Message | Retry? |
|------|------|--------------|--------|
| `VALIDATION_ERROR` | 400 | "Please check your form. Specific fields have errors." | Client correction (don't retry) |
| `PAYMENT_DECLINED` | 402 | "Your card was declined. Please try another card." | Retry with different card |
| `CARD_EXPIRED` | 402 | "Your card has expired. Please use a different card." | Retry with different card |
| `INSUFFICIENT_FUNDS` | 402 | "Insufficient funds. Please try another card." | Retry with different card |
| `3D_SECURE_REQUIRED` | 402 | "Your card requires verification. Please try another card." | Retry with different card |
| `IDEMPOTENCY_CONFLICT` | 409 | "Order already submitted. [Showing existing order...]" | Return existing order (see below) |
| `RATE_LIMIT` | 429 | "Too many attempts. Please wait before trying again." | Retry after backoff (30 sec, 60 sec, 120 sec) |
| `TIMEOUT` | 504 | "Payment processing timed out. Please try again." | Retry (status is unchanged on server) |
| `SERVER_ERROR` | 500 | "An unexpected error occurred. Please contact support." | Retry with support involvement |

**Idempotency**:
- If same `Idempotency-Key` is submitted twice within 5 minutes, return cached response from first request (201 with order)
- Server returns 409 Conflict if order already completed for this key
- Client stores `Idempotency-Key` in session while processing; reuse if user retries

---

### 1.2 GET /api/orders/:orderId

**Purpose**: Retrieve order details (for order confirmation page or account).

**Request**:
```http
GET /api/orders/ORD-1234567890 HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>
```

**Response (Success - 200)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "order": {
    "orderId": "ORD-1234567890",
    "personalInfo": { ... },
    "status": "completed",
    "orderTotal": 5998,
    "createdAt": "2026-06-08T15:30:00.000Z",
    "processedAt": "2026-06-08T15:30:05.000Z"
  }
}
```

**Response (Not Found - 404)**:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found"
  }
}
```

---

## 2. Geo API

### 2.1 GET /api/geo/countries

**Purpose**: Retrieve list of countries for address form dropdown.

**Request**:
```http
GET /api/geo/countries HTTP/1.1
Host: api.example.com
```

**Response (Success - 200)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=604800  // 7 days

{
  "success": true,
  "data": [
    {
      "code": "US",
      "name": "United States",
      "dialCode": "+1"
    },
    {
      "code": "CA",
      "name": "Canada",
      "dialCode": "+1"
    },
    {
      "code": "GB",
      "name": "United Kingdom",
      "dialCode": "+44"
    },
    {
      "code": "AU",
      "name": "Australia",
      "dialCode": "+61"
    }
  ]
}
```

**Caching**:
- Response is cached for 7 days (use `Cache-Control: public, max-age=604800`)
- Client-side: Store in localStorage with TTL; refresh on app startup if TTL expired
- CDN: Can cache for reduced latency

---

### 2.2 GET /api/geo/states/:countryCode

**Purpose**: Retrieve list of states/provinces for country.

**Request**:
```http
GET /api/geo/states/US HTTP/1.1
Host: api.example.com
```

**Response (Success - 200)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=604800

{
  "success": true,
  "data": [
    { "code": "AL", "name": "Alabama" },
    { "code": "AK", "name": "Alaska" },
    { "code": "AZ", "name": "Arizona" },
    { "code": "AR", "name": "Arkansas" },
    { "code": "CA", "name": "California" },
    // ... more states
  ]
}
```

**Response (Invalid Country - 404)**:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "COUNTRY_NOT_FOUND",
    "message": "Country code not recognized"
  }
}
```

---

## 3. Address API

### 3.1 POST /api/addresses/validate

**Purpose**: Validate address format and ZIP code against state (e.g., ensure CA ZIP starts with 9).

**Request**:
```http
POST /api/addresses/validate HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "streetAddress": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94102",
  "country": "US"
}
```

**Response (Valid - 200)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "valid": true,
    "standardized": {
      "streetAddress": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "US"
    }
  }
}
```

**Response (Invalid - 422)**:
```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "The address provided is invalid or incomplete",
    "details": {
      "postalCode": "Postal code 12345 does not match state CA (expected 9xxxx format)"
    }
  }
}
```

**Behavior**:
- Validates postal code against state/country rules
- Returns standardized format (USPS, Royal Mail, Canada Post formatting)
- Soft validation: If address cannot be verified, return `valid: false` but don't block checkout
- Server-side validation in checkout submission is authoritative

---

### 3.2 GET /api/addresses/autocomplete?query=123+Main

**Purpose**: Autocomplete address suggestions (optional for v1; future enhancement).

**Request**:
```http
GET /api/addresses/autocomplete?query=123+Main+St&country=US HTTP/1.1
Host: api.example.com
```

**Response (Success - 200)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "streetAddress": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "US"
    },
    {
      "streetAddress": "123 Main Street",
      "city": "Los Angeles",
      "state": "CA",
      "postalCode": "90001",
      "country": "US"
    }
  ]
}
```

**Note**: This endpoint is optional for v1. Can be implemented using Google Maps/Mapbox API on frontend directly.

---

## 4. Error Handling & Resilience

### 4.1 Network Failures

**Client-Side Retry Logic**:
```
1st attempt: immediate
2nd attempt: wait 1 second
3rd attempt: wait 2 seconds
4th attempt: wait 4 seconds
Max: 3 retries (total time < 10 seconds)
```

**Timeout**: 30 seconds per request (abort if no response)

**Fallback**: If payment times out, show message "Payment processing timed out. Check your email for confirmation or try again." (Order may still succeed on server)

### 4.2 Error Response Format

All error responses follow standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": {
      "field1": "Specific error for field1",
      "field2": "Specific error for field2"
    },
    "requestId": "req_uuid_for_support"
  }
}
```

### 4.3 Common HTTP Status Codes

| Status | Meaning | Retry? |
|--------|---------|--------|
| 200 | Success | No |
| 201 | Created (order submitted) | No |
| 400 | Bad request (validation error) | No (client must fix) |
| 401 | Unauthorized (auth required) | No (user must authenticate) |
| 402 | Payment required (card declined) | Retry with different card |
| 404 | Not found (order doesn't exist) | No |
| 409 | Conflict (idempotency duplicate) | Return cached response |
| 422 | Unprocessable entity (address invalid) | Retry with corrected address |
| 429 | Too many requests (rate limit) | Retry after backoff |
| 500 | Server error | Retry with exponential backoff |
| 503 | Service unavailable | Retry with exponential backoff |
| 504 | Gateway timeout | Retry (server state is unclear) |

---

## 5. Security & Authentication

### 5.1 HTTPS Required

All API endpoints must use HTTPS (TLS 1.2+). HTTP requests are not allowed.

### 5.2 Authentication

- **Guest checkout**: No auth required; anonymous session
- **Authenticated checkout**: Bearer token in Authorization header
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 5.3 CORS

- Allow POST/GET from checkout domain only
- No credentials sent with CORS requests (server manages session via token)

### 5.4 Rate Limiting

- Payment submission: 5 requests per minute per IP
- Address validation: 20 requests per minute per IP
- Geo data: No limit (cacheable)

---

## 6. Pagination & Filtering

Not applicable for v1. All endpoints return complete data or empty arrays.

---

## 7. API Versioning

Current version: **v1**

Future versions may introduce:
- `/api/v2/orders/submit` with additional fields (promo codes, gift cards)
- Backward compatibility: v1 endpoints remain supported

---

## 8. Webhooks (Future)

**Post-Payment Notifications** (v2 feature):
- `order.completed` — Payment succeeded
- `order.failed` — Payment declined
- `order.shipped` — Order shipped

---

## 9. Testing Fixtures

### 9.1 Test Card Numbers

```
Visa (succeeds):        4242 4242 4242 4242
Visa (failure):         4000 0000 0000 0002
Mastercard (succeeds):  5555 5555 5555 4444
Amex (succeeds):        3782 822463 10005
Expired (fails):        4000 0000 0000 0069 (expires 12/22)
3D Secure (requires):   4000 0025 0000 3010
```

### 9.2 Test Addresses

```json
{
  "streetAddress": "510 Townsend St",
  "city": "San Francisco",
  "state": "CA",
  "postalCode": "94103",
  "country": "US"
}
```

---

## 10. Monitoring & Analytics

All requests logged with:
- Timestamp
- Request ID (for tracing)
- User ID (if authenticated)
- Endpoint
- Response status
- Response time

Errors are alerted on:
- > 5% failure rate
- Response time > 15 seconds (p99)
- Any 5xx errors

