/**
 * Auth utilities for Cognito + Ping SSO
 */

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const LOGOUT_URI = import.meta.env.VITE_LOGOUT_URI;

// Identity provider name as configured in Cognito
const IDENTITY_PROVIDER = import.meta.env.VITE_IDENTITY_PROVIDER || 'Ping';

/**
 * Generate the Cognito Hosted UI login URL
 * This will redirect to Ping for authentication
 */
export function getLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: REDIRECT_URI,
    identity_provider: IDENTITY_PROVIDER, // This triggers direct redirect to Ping
  });

  console.log('getLoginUrl', `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`);
  alert(`${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`)
  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

/**
 * Generate the Cognito logout URL
 */
export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: LOGOUT_URI,
  });

  return `https://${COGNITO_DOMAIN}/logout?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens via backend
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  success: boolean;
  tokens?: {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };
  user?: {
    email?: string;
    name?: string;
    sub?: string;
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to exchange code for tokens',
      };
    }

    return {
      success: true,
      tokens: data.tokens,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Parse JWT token to get user info (client-side, for display only)
 */
export function parseIdToken(idToken: string): Record<string, unknown> | null {
  try {
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
