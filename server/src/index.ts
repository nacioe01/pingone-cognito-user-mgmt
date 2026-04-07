/**
 * Express server for handling Cognito OAuth token exchange
 * 
 * This server handles the backend portion of the OAuth flow:
 * 1. Receives authorization code from frontend
 * 2. Exchanges code for tokens with Cognito
 * 3. Returns tokens and user info to frontend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Configuration from environment
const config = {
  cognitoDomain: process.env.COGNITO_DOMAIN || '',
  clientId: process.env.COGNITO_CLIENT_ID || '',
  clientSecret: process.env.COGNITO_CLIENT_SECRET || '',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:5173/callback',
};

const pingOneConfig = {
  clientId: process.env.PINGONE_CLIENT_ID || '',
  clientSecret: process.env.PINGONE_CLIENT_SECRET || '',
  environmentId: process.env.PINGONE_ENVIRONMENT_ID || '',
  region: process.env.PINGONE_REGION || 'com',
};

let pingOneTokenCache: { token: string; expiresAt: number } | null = null;

async function getPingOneAccessToken(): Promise<string> {
  if (pingOneTokenCache && Date.now() < pingOneTokenCache.expiresAt) {
    return pingOneTokenCache.token;
  }

  const tokenUrl = `https://auth.pingone.${pingOneConfig.region}/${pingOneConfig.environmentId}/as/token`;
  console.log('[PingOne] Token URL:', tokenUrl);
  console.log('[PingOne] client_id:', pingOneConfig.clientId);
  console.log('[PingOne] environmentId:', pingOneConfig.environmentId);
  console.log('[PingOne] region:', pingOneConfig.region);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        "Basic " +
        Buffer.from(pingOneConfig.clientId + ":" + pingOneConfig.clientSecret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials'
    }).toString(),
  });

  if (!response.ok) {
    const rawText = await response.text();
    console.error('[PingOne] Token error status:', response.status);
    console.error('[PingOne] Token error raw response:', rawText);
    let err: any = {};
    try { err = JSON.parse(rawText); } catch {}
    throw new Error(`PingOne token error: ${err.error_description || err.error || rawText}`);
  }

  const data = await response.json();
  pingOneTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };

  const base64 = data.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
  console.log('[PingOne] access_token payload:', payload);
  return pingOneTokenCache.token;
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    config: {
      cognitoDomainConfigured: !!config.cognitoDomain,
      clientIdConfigured: !!config.clientId,
      clientSecretConfigured: !!config.clientSecret,
    }
  });
});

/**
 * OAuth callback endpoint
 * Exchanges authorization code for tokens
 */
app.post('/api/auth/callback', async (req, res) => {
  const { code } = req.body;
  console.log('code received from callback', code);
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  // Validate configuration
  if (!config.cognitoDomain || !config.clientId) {
    console.error('Missing Cognito configuration');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'Cognito domain or client ID not configured'
    });
  }

  try {
    // Prepare token request
    const tokenUrl = `${config.cognitoDomain}/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
    });

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add client secret if configured (for confidential clients)
    if (config.clientSecret) {
      const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    console.log(`Exchanging code for tokens at: ${tokenUrl}`);

    // Exchange code for tokens
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.status(tokenResponse.status).json({
        error: tokenData.error || 'Token exchange failed',
        details: tokenData.error_description || 'Failed to exchange authorization code for tokens',
      });
    }

    // Parse ID token to get user info
    let user = {};
    if (tokenData.id_token) {
      try {
        const base64 = tokenData.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        console.log('payload from id_token', payload);
        user = {
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.preferred_username || payload.email,
        };
      } catch (parseError) {
        console.error('Failed to parse ID token:', parseError);
      }
    }

    console.log('Authentication successful for user:', user);

    // Return tokens and user info
    res.json({
      tokens: {
        access_token: tokenData.access_token,
        id_token: tokenData.id_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      },
      user,
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Token refresh endpoint
 */
app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const tokenUrl = `https://${config.cognitoDomain}/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id: config.clientId,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (config.clientSecret) {
      const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: params.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        error: tokenData.error || 'Token refresh failed',
      });
    }

    res.json({
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * List all users from PingOne
 */
app.get('/api/pingone/users', async (_req, res) => {
  if (!pingOneConfig.clientId || !pingOneConfig.clientSecret || !pingOneConfig.environmentId) {
    return res.status(500).json({ error: 'PingOne configuration is incomplete' });
  }

  try {
    const accessToken = await getPingOneAccessToken();

    const usersUrl = `https://api.pingone.${pingOneConfig.region}/v1/environments/${pingOneConfig.environmentId}/users`;
    const response = await fetch(usersUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: 'Failed to fetch users from PingOne', details: err });
    }

    const data = await response.json();
    res.json({
      users: data._embedded?.users ?? [],
      count: data.count,
      size: data.size,
    });
  } catch (error) {
    console.error('PingOne users error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Cognito-Ping Auth Server running on http://localhost:${PORT}`);
  console.log('\nConfiguration status:');
  console.log(`  - Cognito Domain: ${config.cognitoDomain ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  - Client ID: ${config.clientId ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  - Client Secret: ${config.clientSecret ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  - Redirect URI: ${config.redirectUri}`);
  console.log('\nEndpoints:');
  console.log('  GET  /api/health        - Health check');
  console.log('  POST /api/auth/callback - Exchange code for tokens');
  console.log('  POST /api/auth/refresh  - Refresh access token\n');
});
