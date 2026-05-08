# API Reference

Base URL in local development:

```text
http://localhost:5223/api
```

`GET /api` returns a small status payload and is safe to open in a browser. The app UI is served by the frontend dev server, usually `http://localhost:5173`.

The frontend can override this with:

```text
VITE_API_BASE_URL=http://localhost:5223/api
```

## Authentication

Most endpoints require JWT bearer auth:

```http
Authorization: Bearer <token>
```

The API also receives `Accept-Language`, but backend error text does not depend on it. The client translates error codes locally.

## Error Contract

Errors are returned as `application/problem+json`. The required client-facing field is `code`.

Example:

```json
{
  "title": "Request error",
  "status": 400,
  "detail": "group.onlyOwnerCan",
  "code": "group.onlyOwnerCan"
}
```

Common codes:

| Code | Meaning |
| --- | --- |
| `auth.unauthorized` | Missing or invalid authenticated user. |
| `auth.invalidCredentials` | Email/password login failed. |
| `auth.emailExists` | Email is already registered. |
| `currency.required` | Currency was missing. |
| `currency.unsupported` | Currency is not in the supported ISO code set. |
| `group.notFound` | Group does not exist or is not visible to the user. |
| `group.notMember` | User is not a group member. |
| `group.onlyOwnerCan` | Action is owner-only. |
| `group.memberHasDebts` | Member cannot be removed while they have a non-zero balance. |
| `expense.splitSumMismatch` | Split sum does not match total amount. |
| `expense.usersNotMembers` | Payer or split participant is outside the group. |
| `payment.invalidAmount` | Payment amount is not positive or exceeds UI rules. |
| `payment.self` | Payment from and to users are the same. |
| `payment.alreadyVoided` | Payment was already voided. |

## Auth

### `POST /auth/register`

Request:

```json
{
  "email": "ada@example.com",
  "password": "correct horse battery staple",
  "name": "Ada"
}
```

Response contains the authenticated user and JWT token.

### `POST /auth/login`

Request:

```json
{
  "email": "ada@example.com",
  "password": "correct horse battery staple"
}
```

### `POST /auth/google`

Request:

```json
{
  "credential": "<google-credential>"
}
```

## Users

### `GET /users/me`

Returns current profile:

```json
{
  "id": "d7c4...",
  "name": "Ada",
  "email": "ada@example.com",
  "avatarKey": "spark",
  "bio": "Trip planner",
  "hasPassword": true
}
```

### `PUT /users/me`

Request:

```json
{
  "name": "Ada Lovelace",
  "bio": "I plan trips.",
  "avatarKey": "spark"
}
```

### `POST /users/me/password`

Request:

```json
{
  "currentPassword": "old password",
  "newPassword": "new password"
}
```

## Groups

### `GET /groups`

Returns groups visible to the current user.

Important fields:

- `defaultCurrency`
- `ownerId`
- `myBalanceByCurrency`
- `membersCount`
- `lastActive`

### `POST /groups`

Request:

```json
{
  "name": "Ski Trip",
  "defaultCurrency": "PLN"
}
```

The creator is inserted into `GroupMembers` as `Owner`.

### `GET /groups/{id}`

Returns full group details:

```json
{
  "id": "group-id",
  "name": "Ski Trip",
  "defaultCurrency": "PLN",
  "ownerId": "user-id",
  "members": [],
  "expenses": [],
  "balancesByCurrency": {
    "PLN": {
      "user-a": 120,
      "user-b": -120
    }
  },
  "optimizedDebtsByCurrency": {
    "PLN": [
      {
        "fromUserId": "user-b",
        "toUserId": "user-a",
        "amount": 120
      }
    ]
  }
}
```

### `PUT /groups/{id}`

Owner-only.

Request:

```json
{
  "name": "Ski Trip 2026",
  "description": "Flights, hotel, food",
  "avatarKey": "ski",
  "defaultCurrency": "EUR"
}
```

### `POST /groups/{id}/join`

Adds the current user to a group as `Member`.

### `GET /groups/{id}/members`

Returns members and roles.

### `PUT /groups/{id}/members/{userId}/role`

Owner-only. Currently supports changing between `Member = 0` and `Admin = 1`; owner role cannot be changed through this endpoint.

Request:

```json
{
  "role": 1
}
```

### `DELETE /groups/{id}/members/{userId}`

Owner can remove other members if their balance is zero. A non-owner can remove only themselves, also only when settled.

## Expenses

### `GET /expenses/{id}`

Returns expense details if current user belongs to the group.

### `POST /expenses`

Request:

```json
{
  "groupId": "group-id",
  "payerId": "payer-user-id",
  "title": "Hotel",
  "totalAmount": 300,
  "currency": "PLN",
  "splitMethod": "exact",
  "splits": [
    { "userId": "user-a", "owedAmount": 150 },
    { "userId": "user-b", "owedAmount": 150 }
  ]
}
```

Rules:

- `totalAmount > 0`
- title is trimmed and max 160 chars
- currency is normalized through supported ISO codes
- every split user must be a group member
- split sum must match total amount within tolerance

### `PUT /expenses/{id}`

Same payload as create.

### `DELETE /expenses/{id}?groupId={groupId}`

Deletes an expense and writes an activity log entry.

## Payments

Payments are settlements. They are not expenses.

### `GET /groups/{groupId}/payments`

Query params:

- `skip`
- `take`

Returns newest payments first.

### `POST /groups/{groupId}/payments`

Request:

```json
{
  "fromUserId": "debtor-id",
  "toUserId": "creditor-id",
  "amount": 75,
  "currency": "PLN",
  "note": "Bank transfer"
}
```

Response status is `Recorded`.

### `POST /payments/{id}/void`

Marks a payment as `Voided`. Voided payments remain in history but are ignored by balance calculation.

## Activity

### `GET /activity`

Current user's activity across groups.

### `GET /groups/{id}/activity`

Activity for a single group.

Activity DTO includes:

- `activityType`
- `metadata`
- `createdAt`
- `userName`
- `memberNames`
- optional group context for global feed

The `content` field can be present for compatibility but UI copy should be derived client-side.

## SignalR

Hub URL:

```text
/hubs/expense
```

Client methods:

- `JoinGroup(groupId)`
- `LeaveGroup(groupId)`

Server events:

- `ExpenseAdded`
- `PaymentUpdated`
