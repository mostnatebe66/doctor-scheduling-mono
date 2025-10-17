# PD&S Doctor Scheduling App

A simple full-stack app for managing a doctor's daily schedule.

## Stack

- **Backend**: Node.js + TypeScript + Express + Mongoose
- **DB**: MongoDB
- **Frontend**: React (Vite + TypeScript)
- **Containerization**: Docker & docker-compose

## Run (Docker)

```bash
docker compose up
```

- API: http://localhost:3000
- Web: http://localhost:4173

## Run locally (without Docker)

### Backend

```bash
cd doctor-scheduling-api
cp .env.example .env
npm install
npm run build
npm run dev
npm test
```

### Frontend

```bash
cd doctor-scheduling-web-app
npm install
npm run dev
```

- Web Locally: http://localhost:5173

## Notes

- Appointments are 15 minutes long and must start on a quarter hour between 09:00AM and 05:00PM inclusive.
- Lunch 12:00–12:30 skipped by seeder.
- Seed data generates random gaps
