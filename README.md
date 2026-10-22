# LostBU — Campus Lost & Found

> One organized place to report, search and return lost belongings on campus.

LostBU is a full-stack web application that helps university students report lost items,
report found items, search for belongings and track whether an item has been returned.
It was built by a team of four students as a learning project.

## Problem

Students often lose items such as ID cards, wallets, keys and headphones. Information about
them is scattered across social media groups and informal chats, so owners and finders
rarely connect. LostBU provides a single, searchable place for these reports.

## Features

- **Dashboard** with live counts of Lost, Found and Returned items and a responsive item grid
- **Report a lost item** and **report a found item** with form validation and optional photo upload
- **Search and filter**: keyword, category, reported-as (Lost/Found), current status and sort order, all usable together
- **Item details**: photo, description, location, dates, status and contact instructions
- **Status management** that separates *Found* (someone has the item) from *Returned* (the owner has it back; final)
- **Edit and delete** reports, with confirmation before destructive actions
- Loading, empty and error states; keyboard-accessible forms and dialogs

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES modules), Vite dev server |
| Backend | Node.js, Express, multer (image upload), cors, dotenv |
| Database | SQLite via Node's built-in `node:sqlite` |
| Tools | Git and GitHub |

## Architecture

```
Browser (FE, Vite :5173)
   |  HTTP + JSON / multipart (fetch)
   v
Express API (BE :5000)
   routes -> controllers -> services -> models -> SQLite file
                                |
                          validators, status rules
   uploaded photos are stored in BE/uploads and served at /uploads/<file>
```

The frontend and backend are separate applications. They communicate only through the REST API
documented in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

## Project structure

```
LostBU/
├── FE/                 Frontend application
│   ├── index.html
│   └── src/
│       ├── main.js         page logic: list, filters, refresh
│       ├── css/style.css   design system and styles
│       └── js/             api.js, components.js, form.js, details.js
├── BE/                 Backend API
│   ├── server.js
│   ├── routes/ controllers/ services/ models/ middleware/ utils/
│   └── scripts/testModel.js
└── docs/API_CONTRACT.md
```

## Getting started

**Requirements:** Node.js 22.13 or newer (developed on Node 24), npm and Git.

### 1. Backend (terminal 1)

```bash
cd BE
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

The API runs at http://localhost:5000. Check http://localhost:5000/api/health.
On first start the database is created and 8 demo items are inserted (only when the table is empty).
Node prints an `ExperimentalWarning` about SQLite; this is expected.

### 2. Frontend (terminal 2)

```bash
cd FE
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173.

### Environment variables

| File | Variable | Purpose |
|---|---|---|
| `BE/.env` | `PORT` | API port (default 5000) |
| `BE/.env` | `CORS_ORIGIN` | Frontend origin allowed to call the API |
| `BE/.env` | `DB_PATH` | Optional database file location |
| `FE/.env` | `VITE_API_BASE_URL` | URL of the backend API |

`.env` files are not committed; use the `.env.example` files as templates.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Server check |
| GET | `/api/items` | List items (`search`, `category`, `type`, `status`, `sort`) |
| GET | `/api/items/stats` | Counts per status |
| GET | `/api/items/:id` | One item |
| POST | `/api/items` | Create a report (JSON or multipart with `image`) |
| PUT | `/api/items/:id` | Update details, image or status |
| DELETE | `/api/items/:id` | Delete an item and its image |

Full details: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

## Key design decisions

- **`type` vs `status`:** `type` records how a report was filed (Lost/Found) and never changes;
  `status` is the current state. A lost item can go Lost -> Found -> Returned; a found item goes Found -> Returned.
  The backend enforces these rules.
- **Validation on both sides:** the frontend gives quick feedback, the backend always re-validates.
- **Upload safety:** images are limited to JPG/PNG/WebP up to 2 MB, files are renamed with random names,
  and the first bytes of each file are checked so a renamed text file is rejected.
- **XSS protection:** all user-provided text is escaped before it is rendered.
- **SQL injection protection:** all queries use parameter placeholders.

## Testing

- `cd BE && npm run test:model` runs automated checks of the database layer on a separate test database.
- The rest of the application was tested manually with a checklist (create, search, filter, status changes,
  edit, delete, reload, invalid input, missing images, responsive layouts).
- There are no automated frontend tests yet.

## Known limitations

- **No authentication.** Anyone can create, edit or delete any report, and contact details are visible to everyone.
- Data is stored in a local SQLite file and photos in a local folder, so this version is meant for local use.
  Hosting platforms with temporary disks would lose this data; a hosted database and file storage would be needed for production.
- `node:sqlite` is still an experimental Node.js feature.
- No pagination: all matching items are loaded at once.

## Future improvements

- User accounts and ownership checks for editing and deleting
- Hosted database and cloud image storage for deployment
- Pagination, and notifications when a matching item is reported
- Automated frontend and API tests

## Screenshots

Add screenshots to `docs/screenshots/` and reference them here.

## Team

| Member | Responsibility |
|---|---|
| <Name 1> | Frontend UI/UX and layout |
| <Name 2> | Frontend forms, API integration, search and filtering |
| <Name 3> | Backend routes, controllers, validation and business logic |
| <Name 4> | Backend data storage, testing, documentation and deployment support |