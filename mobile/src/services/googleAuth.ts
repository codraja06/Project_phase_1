import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { authApi } from '../api/authApi';
import { User } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResult {
  user: User;
  token: string;
}

export const googleAuthService = {
  /**
   * Prompts Google authentication, verifies token exchange, and establishes an authenticated backend session.
   */
  async signInWithGoogle(role: 'citizen' | 'authority' = 'citizen'): Promise<GoogleAuthResult> {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

    if (clientId) {
      const redirectUri =
        Platform.OS === 'web'
          ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081')
          : AuthSession.makeRedirectUri({
              scheme: 'civictrack',
            });

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `response_type=token%20id_token&` +
        `scope=openid%20profile%20email&` +
        `nonce=${Crypto.randomUUID()}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google Sign-In was cancelled.');
      }

      if (result.type === 'success' && result.url) {
        // Parse token from fragment (#access_token=... or #id_token=...) or query (?id_token=...)
        const hash = result.url.includes('#') ? result.url.split('#')[1] : (result.url.split('?')[1] || '');
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');

        if (!idToken) {
          throw new Error('No authentication token received from Google.');
        }

        const authResponse = await authApi.googleLogin({
          token: idToken,
          role,
        });

        return authResponse;
      }

      throw new Error('Google authentication could not be completed.');
    } else {
      throw new Error('Google sign-in is not configured. Please use email and password.');
    }
  },
};
