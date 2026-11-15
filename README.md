# AMINUL URL TIMER (Smart 60-Second Auto Check Dashboard)

A smart URL timer dashboard configured to periodically hit endpoints (such as `https://nid.proo.one/sms.php?number=...`) every 60 seconds with live countdown, status indicators, and activity logs.

## Running on Render

This project is fully prepared to run on [Render](https://render.com).

### Deployment Steps:
1. Push this repository to your GitHub account.
2. Log in to your Render Dashboard (https://dashboard.render.com).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository (`AminulSardar1/1-minit` or your fork).
5. Render will automatically detect `render.yaml` or use:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click **Create Web Service**.

## Features
- **60-Second Auto Timer**: Automatically triggers every 1 minute with a live countdown timer (`MM:SS`).
- **Server-Side Proxy**: Bypasses CORS restrictions by hitting endpoint checks securely from the backend.
- **Activity Log**: Real-time log showing timestamps and check statuses.
- **Persistent Storage**: Remembers your mobile number in `localStorage`.