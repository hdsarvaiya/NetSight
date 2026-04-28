# NetSight

NetSight is a full-stack network observability platform built to discover devices on a local network, monitor their health in real time, visualize topology, and generate alerts and predictive insights.

The project has three major parts:

- `frontend/` - React dashboard and public website
- `backend/` - Node.js + Express API, MongoDB integration, alerts, analytics, auth
- `agent/` - Local network agent that runs inside the monitored network and pushes telemetry to the backend

## What NetSight Does

NetSight is designed for the common real-world problem where a cloud dashboard cannot directly see devices inside a private LAN.

So the system uses a hybrid architecture:

- The **agent** sits inside the local network and performs discovery + monitoring.
- The **backend** receives and stores device data, creates alerts, manages users, and serves the frontend.
- The **frontend** shows topology, device health, analytics, prediction views, alerts, settings, audit logs, and setup flows.

In simple words:

> The agent is the field worker, the backend is the brain, and the frontend is the control room.

## Core Features

- Organization-based authentication and admin onboarding
- Email verification and password reset via OTP
- Automatic agent key generation for secure machine-to-machine communication
- Local network discovery using ARP, ping, TCP probing, SNMP, DNS, and fingerprinting
- Real-time device health monitoring
- Interactive dashboard for topology, devices, alerts, analytics, and audit logs
- Alert generation with deduplication
- Offline emergency email notification support
- Failure prediction / risk analysis views
- Socket.IO-based live updates from backend to frontend
- Agent control panel UI running locally on the monitored machine

## High-Level Architecture

```text
                      +----------------------+
                      |   React Frontend     |
                      |   localhost:3000     |
                      +----------+-----------+
                                 |
                                 | REST + Socket.IO
                                 v
                      +----------------------+
                      |   Node/Express API   |
                      |   localhost:5000     |
                      +----------+-----------+
                                 |
                                 | MongoDB
                                 v
                      +----------------------+
                      |      MongoDB         |
                      +----------------------+

                                 ^
                                 |
                    HTTP + WebSocket + Agent Key Auth
                                 |
                      +----------+-----------+
                      |   NetSight Agent     |
                      |   localhost:9090 UI  |
                      +----------------------+
```

## How The System Works

### 1. Admin registration

When the first user signs up:

- a new organization is created logically through the user record
- the user is assigned the `admin` role
- a machine agent key is automatically generated
- an email verification OTP is sent

This means every organization gets a secure identity for its local agent from day one.

### 2. Agent setup

The admin logs in, opens the setup flow, downloads the local agent, and configures:

- backend server URL
- agent key
- scan CIDR / subnet range
- scan interval
- poll interval

The agent stores these settings in a local config file.

### 3. Agent validates with backend

Before it starts doing work, the agent validates itself with the backend using the `X-Agent-Key` header.

This is machine-to-machine authentication, separate from user JWT auth.

### 4. Discovery starts

The agent scans the target subnet(s) and discovers devices using:

- ping sweep
- ARP table parsing
- TCP port probing
- reverse DNS / NetBIOS lookup
- SNMP probing
- OS / vendor / device-type fingerprinting

### 5. Monitoring starts

After discovery, the agent continuously polls devices for:

- online/offline state
- latency
- packet loss
- CPU usage
- memory usage
- bandwidth/traffic estimates
- uptime

### 6. Backend processes data

The backend:

- stores or updates devices in MongoDB
- stores time-series metric samples
- generates alerts
- deduplicates repeated alerts
- emits real-time updates to the frontend through Socket.IO

### 7. Frontend visualizes everything

Users can then monitor:

- dashboard summary
- devices list
- topology view
- analytics and trends
- failure prediction
- alerts
- settings
- user management
- audit logs

## Repository Structure

```text
NetSight/
|-- agent/
|   |-- src/
|   |   |-- config.js
|   |   |-- index.js
|   |   `-- services/
|   `-- ui/
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   `-- server.js
|-- frontend/
|   |-- public/
|   `-- src/
|       |-- components/
|       |-- pages/
|       |-- utils/
|       `-- routes.tsx
`-- README.md
```

## Tech Stack

### Frontend

- React 18
- TypeScript
- React Router
- Tailwind-style utility classes / custom CSS
- Socket.IO client
- Recharts
- Lucide icons

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Socket.IO
- Nodemailer
- bcrypt

### Agent

- Node.js
- Express local control panel
- Socket.IO client
- Axios
- `ping`
- `net-snmp`
- `systeminformation`
- `pkg` for packaging native executables

## User Flow For a New User

### Public user journey

1. Open landing page
2. Create an account
3. Verify email with OTP
4. Log in
5. Open setup wizard
6. Download or run the NetSight Agent
7. Enter server URL and agent key
8. Select scan range / interface
9. Start services
10. Watch devices and metrics appear in the dashboard

### Admin capabilities

- manage organization users
- change thresholds and notification preferences
- manage agent keys
- review alerts and audit logs
- trigger rescan / clear devices

## Main Application Pages

The frontend includes:

- Landing page
- Documentation page
- Contact / Privacy / Terms / Security pages
- Sign up / Login / Forgot password / Reset password / Verify email
- Setup wizard
- Dashboard
- Topology
- Devices
- Device details
- Analytics
- Failure prediction
- Alerts
- User management
- Settings
- Audit logs

## Setup Requirements

Before running locally, make sure you have:

- Node.js 18+ recommended
- npm
- MongoDB database (local or Atlas)
- SMTP credentials if you want email-based OTP and alert features

## Environment Variables

Create a `.env` file inside `backend/`.

Example:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/netsight
JWT_SECRET=replace_with_a_long_secure_secret

EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=NetSight <your-email@example.com>
```

### Required backend variables

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key

### Optional but strongly recommended

- `EMAIL_SERVICE`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`

Without email config:

- signup OTP email will fail
- password reset email will fail
- emergency offline email alerts will fail

## Local Development Setup

There is no workspace-level `npm install` for all services together. Install dependencies in each app separately.

### 1. Frontend

```bash
cd frontend
npm install
npm start
```

Runs at:

- `http://localhost:3000`

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Runs at:

- `http://localhost:5000`

### 3. Agent

```bash
cd agent
npm install
npm start
```

Runs local control panel at:

- `http://localhost:9090`

## Production API Behavior

The frontend uses:

- `http://localhost:5000/api/v1` in development
- `https://netsight.online/api/v1` in production

So if you deploy the backend elsewhere, update the frontend API config accordingly.

## Agent Details

The NetSight Agent is the most important system component from a networking perspective.

### What it does

- validates itself with the backend
- opens heartbeat communication
- discovers devices on the LAN
- classifies device types
- continuously monitors device reachability and health
- sends scan results and metrics to the backend
- shows a local web UI for operators

### Agent startup order

1. Validate connection
2. Connect WebSocket
3. Start heartbeat
4. Run first scan
5. Start device monitoring
6. Start periodic rescans

### Agent communication channels

- **HTTP** for validation, persistence, fallback delivery
- **WebSocket** for low-latency live telemetry and status relay

### Agent packaging

The agent can be packaged into executables using:

```bash
cd agent
npm run build:win
npm run build:linux
npm run build:mac
```

The backend download route expects the generated executable to exist in `agent/dist/`.

## Backend Details

The backend is responsible for:

- user auth
- agent auth
- organization isolation
- device storage
- metrics storage
- alert creation
- notification logic
- audit logging
- Socket.IO broadcasts

### Important backend modules

- `controllers/` - business logic for auth, settings, monitoring, devices, users, audit
- `routes/` - API route definitions
- `middleware/` - JWT auth, agent auth, error handling
- `models/` - MongoDB schemas
- `services/` - background monitoring
- `utils/` - alerts, email, sockets, tokens, live-state helpers

### Core API groups

#### Auth

- register
- login
- verify OTP
- forgot password
- reset password

#### Devices

- scan network
- save setup devices
- add devices
- fetch devices
- clear devices
- delete device

#### Monitoring

- dashboard stats
- topology
- alerts
- analytics trends
- device metrics
- failure prediction

#### Settings

- update thresholds and notification settings
- generate/revoke agent keys
- list active agents
- download built agent

#### Agent

- validate
- heartbeat
- scan results
- metrics
- get device list
- get settings

## Monitoring Modes

NetSight supports two monitoring styles:

### 1. Remote agent monitoring

Preferred mode.

The agent runs inside the network and sends results to the backend.

### 2. Backend fallback monitoring

The backend also has a built-in monitoring service.

This is useful if:

- the remote agent is not connected
- you are testing locally
- you need fallback behavior

When a real agent is active for an organization, the backend avoids duplicating monitoring work for that organization.

## Alerts and Notifications

Alerts are generated when metrics cross configured thresholds.

Current alert categories include:

- `AVAILABILITY`
- `PERFORMANCE`
- `SECURITY` schema support exists, though current runtime logic is focused mainly on availability/performance

Severity levels:

- `critical`
- `warning`
- `info`

Examples:

- device offline -> critical
- high latency -> warning
- high packet loss -> warning
- high CPU or memory -> warning

### Alert behavior

- repeated active alerts are deduplicated
- alert status can move through `NEW`, `ACKNOWLEDGED`, `RESOLVED`, `CLOSED`
- real-time alert updates are pushed to the frontend

### Offline email notification

The project includes backend logic for emailing admins when a device has been offline continuously for a configured delay period.

This depends on:

- email notifications being enabled
- SMTP credentials being configured
- admin users existing for the organization

## Real-Time Features

NetSight uses Socket.IO in two directions:

### Agent -> Backend

- metrics
- scan results
- heartbeat status

### Backend -> Frontend

- live device updates
- alert updates
- agent status updates
- topology-related changes

This reduces page refresh dependency and makes the dashboard feel live.

## Database Models

Main backend schemas:

- `User`
- `Agent`
- `Device`
- `DeviceMetric`
- `Alert`
- `Settings`
- `Audit`

These support:

- multi-user organizations
- device inventory
- metric history
- thresholds and preferences
- operational traceability

## Security Model

NetSight separates human auth from machine auth:

- **Users** authenticate with JWTs
- **Agents** authenticate with hashed agent keys

Additional security-related points:

- organization-scoped data access
- password hashing with bcrypt
- email verification flow
- audit logging of sensitive actions
- local agent runs inside the firewall and pushes data outward, reducing inbound exposure

## Common Ports In Development

- Frontend: `3000`
- Backend API: `5000`
- Agent local UI: `9090`

## Recommended First Demo

If you are showing the project to a new user, do this:

1. Start backend
2. Start frontend
3. Register a new admin account
4. Verify email
5. Log in
6. Open setup wizard
7. Start the agent
8. Configure local subnet
9. Run scan
10. Open dashboard, devices, topology, alerts

This gives the clearest end-to-end demonstration.

## Troubleshooting

### Frontend cannot connect to backend

Check:

- backend is running on port `5000`
- frontend API base is pointing to the correct backend
- CORS configuration allows your origin

### Backend fails at startup

Check:

- `.env` exists
- `MONGO_URI` is valid
- `JWT_SECRET` is set

### OTP / email alerts do not work

Check:

- SMTP variables are configured correctly
- email provider allows app passwords / SMTP access

### Agent cannot validate

Check:

- correct `serverUrl`
- correct `agentKey`
- backend is reachable from the monitored machine
- `/api/v1/agent/validate` is accessible

### No devices appear

Check:

- scan CIDR is correct
- the agent is running inside the correct network
- local firewall permissions allow probing
- backend is receiving `/scan-results`

### Live updates do not appear

Check:

- Socket.IO connection on frontend
- backend WebSocket namespace availability
- agent WebSocket authentication

## Notes For Contributors

- The project currently uses separate `npm install` flows for `frontend`, `backend`, and `agent`.
- The root `package-lock.json` is only a placeholder and does not represent a workspace install.
- There is a lightweight frontend `README.md`, but this file is the main project-level reference.
- There is currently no formal automated test suite configured.

## Suggested Future Improvements

- add a root workspace setup for frontend/backend/agent
- add Docker support
- add `.env.example`
- add automated tests
- add CI pipelines
- improve agent key lookup efficiency
- extend alerting into Slack/SMS integrations
- formalize deployment documentation

## Project Summary

NetSight is a practical hybrid network monitoring platform for environments where central dashboards alone cannot see private LAN devices.

Its strength is the combination of:

- local visibility through the agent
- centralized analytics through the backend
- real-time usability through the frontend

If you are new to the project, start with this order:

1. read this README
2. run backend
3. run frontend
4. run agent
5. complete setup wizard
6. watch the first scan populate the dashboard
