# Cognito + Ping SSO Authentication

A simple React application demonstrating SSO authentication using AWS Cognito with Ping Identity as the Identity Provider.

## Prerequisites

- Node.js 18+ 
- AWS Account with Cognito User Pool configured
- Ping Identity configured as IdP in Cognito

## AWS Cognito Setup

1. **Create a Cognito User Pool** in AWS Console
2. **Add Ping as Identity Provider**:
   - Go to User Pool → Sign-in experience → Federated identity provider sign-in
   - Add identity provider → Choose SAML or OIDC (depending on your Ping setup)
   - Configure with your Ping tenant details
3. **Create App Client**:
   - Go to App integration → App clients
   - Create a new app client
   - Note the Client ID and Client Secret
4. **Configure Hosted UI**:
   - Set callback URLs: `http://localhost:5173/callback`
   - Set sign-out URLs: `http://localhost:5173`
   - Enable the Ping IdP for this app client

## Installation

```bash
# Install all dependencies
npm run install:all

# Or install separately
npm install
cd client && npm install
cd ../server && npm install
```

## Configuration

1. Copy `.env.example` to create environment files:

```bash
# For client
cp .env.example client/.env

# For server
cp .env.example server/.env
```

2. Fill in your Cognito and Ping configuration values.

## Running the Application

```bash
# Run both client and server concurrently
npm run dev

# Or run separately
npm run dev:client  # React app on http://localhost:5173
npm run dev:server  # Express server on http://localhost:3001
```

## How It Works

1. User clicks "Sign in with Ping" button
2. User is redirected to Cognito Hosted UI
3. Cognito redirects to Ping for authentication
4. After successful Ping login, user is redirected back to Cognito
5. Cognito redirects to the app's callback URL with an authorization code
6. The app exchanges the code for tokens via the backend server
7. Success or failure is displayed to the user

## Project Structure

```
cognito-ping/
├── client/                 # React frontend (Vite + Tailwind + shadcn/ui)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── lib/           # Utilities
│   │   └── App.tsx        # Main app component
│   └── ...
├── server/                 # Express backend (TypeScript)
│   ├── src/
│   │   └── index.ts       # Server entry point
│   └── ...
├── .env.example           # Environment variables template
└── package.json           # Root package with concurrent scripts
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID |
| `VITE_COGNITO_DOMAIN` | Cognito domain (without https://) |
| `VITE_COGNITO_REGION` | AWS Region |
| `VITE_REDIRECT_URI` | OAuth callback URL |
| `COGNITO_CLIENT_SECRET` | App Client Secret (server only) |
