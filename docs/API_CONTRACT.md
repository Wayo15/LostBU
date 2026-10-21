# LostBU API Contract

Base URL (development): `http://localhost:5000`

## Response format

```json
{ "success": true, "data": {}, "message": "..." }
{ "success": true, "data": [], "count": 0 }
{ "success": false, "message": "...", "errors": { "name": "Name is required" } }
```

## Item data model

| Field | Type | Required | Notes |
|---|---|---|---|
| id | number | auto | Created by the database |
| type | string | yes | `Lost` or `Found` (how the report was filed; never changes) |
| status | string | auto | `Lost`, `Found`, `Returned` (starts equal to `type`) |
| name | string | yes | 2-100 characters |
| category | string | yes | ID Cards, Wallets, Keys, Electronics, Accessories, Bottles, Bags, Other |
| description | string | yes | 10-1000 characters |
| location | string | yes | Where it was lost / found |
| eventDate | string | yes | `YYYY-MM-DD` |
| contact | string | yes | Contact instructions (no ID numbers or bank details) |
| imageUrl | string | no | Image location (storage strategy decided later) |
| createdAt | string | auto | ISO timestamp |
| updatedAt | string | auto | ISO timestamp |

## Status rules

- type `Lost`:  Lost -> Found -> Returned
- type `Found`: Found -> Returned
- `Returned` is final.

## Endpoints

| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| GET | /api/health | Server check | 200 | - |
| GET | /api/items | List items (filterable) | 200 | - |
| GET | /api/items/stats | Count of items per status (for dashboard cards) | 200 | - |
| GET | /api/items/:id | Get one item | 200 | 404 |
| POST | /api/items | Create a report | 201 | 400 |
| PUT | /api/items/:id | Update info or status | 200 | 400, 404 |
| DELETE | /api/items/:id | Delete an item | 200 | 404 |

## Query parameters for GET /api/items

| Param | Values |
|---|---|
| search | keyword matched against name and description |
| category | one of the categories above |
| type | `Lost` / `Found` |
| status | `Lost` / `Found` / `Returned` |
| sort | `newest` (default) / `oldest` (by createdAt) |

Example: `GET /api/items?search=wallet&category=Wallets&status=Found&sort=newest`

## Model interface (BE/models/itemModel.js)

```
findAll(filters)   -> array of items
findById(id)       -> item or null
create(data)       -> created item
update(id, data)   -> updated item, or null if not found
remove(id)         -> true / false
countByStatus()    -> { Lost, Found, Returned }
```