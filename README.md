# AI Voice Agent SaaS MVP

A minimal viable product for an AI voice agent SaaS platform with vendor management.

## Features

### Vendor Panel
- **Authentication**: Register and login system
- **Profile Management**: Complete profile with personal and company details
- **Call Scheduling**: Schedule AI voice calls with phone numbers, context, and timing
- **Dashboard**: View scheduled calls and their status

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Visit `http://localhost:3000` to access the vendor panel

## Database

Uses MongoDB with the `ai-agent-saas` database. The connection string is configured for the provided cluster.

## Project Structure

```
├── models/
│   ├── Vendor.js          # Vendor model with authentication
│   └── ScheduleCall.js    # Schedule call model
├── routes/
│   └── vendor.js          # Vendor routes (auth, profile, dashboard)
├── views/vendor/
│   ├── login.ejs          # Login page
│   ├── register.ejs       # Registration page
│   ├── profile.ejs        # Profile completion page
│   └── dashboard.ejs      # Main dashboard
├── server.js              # Main server file
└── package.json
```

## Next Steps

- Add admin panel
- Implement actual AI voice calling functionality
- Add call status updates
- Enhance UI/UX
- Add API endpoints for mobile apps