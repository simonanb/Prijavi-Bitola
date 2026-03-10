# Пријави Битола

Civic issue reporting web app for the city of Bitola, North Macedonia.

## Quick Start

### 1. Install server dependencies
```bash
cd prijavi-bitola
npm install
```

### 2. Install client dependencies
```bash
cd client
npm install
cd ..
```

### 3. Run in development (both server + client)
```bash
npm run dev
```

- Client (Vite):  http://localhost:5173
- API server:     http://localhost:3001

### 4. Build & run in production
```bash
npm run prod
```
Serves everything from http://localhost:3001

---

## Routes

| Path     | Description                        |
|----------|------------------------------------|
| `/`      | Map + report feed                  |
| `/admin` | Admin panel (change report status) |

## API

| Method | Path                       | Description            |
|--------|----------------------------|------------------------|
| GET    | /api/reports?sort=newest   | List all reports       |
| GET    | /api/reports?sort=upvotes  | List sorted by upvotes |
| POST   | /api/reports               | Submit report (form)   |
| POST   | /api/reports/:id/upvote    | Upvote a report        |
| PATCH  | /api/reports/:id/status    | Update status (admin)  |
| DELETE | /api/reports/:id           | Delete report (admin)  |

## Report statuses
- `submitted` → Поднесено
- `in_review` → Во преглед
- `resolved`  → Решено
