# QuickPoll — Online Poll Management App

A simple full-stack web application implementing:
- Public page to view active polls and submit votes.
- Admin interface to create, activate/deactivate, update, and delete polls.
- MongoDB/Mongoose data model for polls and options.
- REST API for public and admin operations.

## Run
1. Install Node.js 18+ and MongoDB.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `ADMIN_TOKEN`.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000` for public polls or `/admin.html` for administration.

## API
- `GET /api/polls` — active polls
- `GET /api/polls?admin=true` — all polls (currently intended for admin UI; protect this route in production)
- `GET /api/polls/:id` — one poll
- `POST /api/polls/:id/vote` — submit `{ "optionId": "..." }`
- `POST /api/polls` — admin create
- `PUT /api/polls/:id` — admin update
- `DELETE /api/polls/:id` — admin delete

## Production notes
Add proper admin authentication/session/JWT, rate-limit voting, prevent duplicate votes if required, validate all input, use HTTPS, and protect the admin listing endpoint with authentication.
