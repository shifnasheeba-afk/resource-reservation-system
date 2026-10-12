# Resource Reservation Management System

A web-based Resource Reservation Management System developed as part of the PrimeWave Software Engineering Internship assessment.

The application allows users to manage resources, create reservations, check availability, and prevent overlapping bookings.

## Features

- Add and manage resources.
- View available resources.
- Create reservations with start and end times.
- Check resource availability for a selected time period.
- Prevent overlapping reservations for the same resource.
- Store resource and reservation data in PostgreSQL.
- REST API endpoints for resources and reservations.

## Technologies Used

- Next.js
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Git and GitHub

## Prerequisites

Before running the project, install:

- Node.js and npm
- PostgreSQL
- Git

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shifnasheeba-afk/resource-reservation-system.git
cd resource-reservation-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the PostgreSQL Database

Open PostgreSQL and create a database named:

```text
resource_reservation_db
```

### 4. Configure Environment Variables

Create a file named `.env` in the project root directory and add:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/resource_reservation_db"
```

Replace `PASSWORD` with local PostgreSQL password. If your PostgreSQL username or port is different, update the connection URL accordingly.

**Important:** Do not upload the `.env` file or your database password to GitHub.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Apply Database Migrations

```bash
npx prisma migrate deploy
```

### 7. Start the Development Server

```bash
npm run dev
```

Open the following URL in your browser:

http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resources` | Retrieve resources |
| POST | `/api/resources` | Create a resource |
| GET | `/api/reservations` | Retrieve reservations |
| POST | `/api/reservations` | Create a reservation |

## Reservation Conflict Prevention

The system checks existing reservations for the selected resource and time period. If the requested reservation overlaps with an existing reservation, the system rejects the booking.

The overlap condition is:

```text
requestedStart < existingEnd
AND
requestedEnd > existingStart
```

This allows reservations to be made for separate, non-overlapping time periods.

## Database Design

The database contains two main entities:

- **Resource:** Stores resource details such as name, type, description, location, and capacity.
- **Reservation:** Stores reservation details, user information, start and end times, status, and the related resource ID.

**Relationship:** One resource can have many reservations. Each reservation belongs to one resource.

## Repository

GitHub: https://github.com/shifnasheeba-afk/resource-reservation-system
