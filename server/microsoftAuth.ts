import { ConfidentialClientApplication, LogLevel, CryptoProvider, ResponseMode, AuthorizationUrlRequest } from '@azure/msal-node';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import 'express-session';

// Extend the express-session typing to include our custom fields
declare module 'express-session' {
  interface SessionData {
    pkceCodes?: {
      verifier: string;
      challenge: string;
      state: string;
    };
    microsoftUser?: {
      idToken: string;
      accessToken: string;
      account: any;
      expiresOn: Date;
    };
  }
}

// Required environment variables for Microsoft authentication
if (process.env.MICROSOFT_AUTH_ENABLED === 'true') {
  if (!process.env.MICROSOFT_CLIENT_ID) {
    throw new Error('Environment variable MICROSOFT_CLIENT_ID is required for Microsoft authentication');
  }
  if (!process.env.MICROSOFT_CLIENT_SECRET) {
    throw new Error('Environment variable MICROSOFT_CLIENT_SECRET is required for Microsoft authentication');
  }
  if (!process.env.MICROSOFT_TENANT_ID) {
    throw new Error('Environment variable MICROSOFT_TENANT_ID is required for Microsoft authentication');
  }
  if (!process.env.MICROSOFT_REDIRECT_URI) {
    throw new Error('Environment variable MICROSOFT_REDIRECT_URI is required for Microsoft authentication');
  }
}

// Create MSAL application
const createMsalApp = () => {
  if (process.env.MICROSOFT_AUTH_ENABLED !== 'true') {
    return null;
  }

  try {
    return new ConfidentialClientApplication({
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) {
              return;
            }
            switch (level) {
              case LogLevel.Error:
                console.error('MSAL:', message);
                break;
              case LogLevel.Warning:
                console.warn('MSAL:', message);
                break;
              case LogLevel.Info:
                console.info('MSAL:', message);
                break;
              case LogLevel.Verbose:
                console.debug('MSAL:', message);
                break;
              default:
                console.log('MSAL:', message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Info,
        },
      },
    });
  } catch (error) {
    console.error('Error creating MSAL application:', error);
    return null;
  }
};

// Setup Microsoft authentication routes and middleware
export function setupMicrosoftAuth(app: Express) {
  if (process.env.MICROSOFT_AUTH_ENABLED !== 'true') {
    console.info('Microsoft authentication is disabled');
    return;
  }

  console.info('Setting up Microsoft authentication...');
  const msalApp = createMsalApp();
  
  if (!msalApp) {
    console.error('Failed to create MSAL application');
    return;
  }

  const cryptoProvider = new CryptoProvider();

  // Login route
  app.get('/api/login/microsoft', async (req, res) => {
    // Generate PKCE challenge and verifier
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
    
    // Store the PKCE verifier in session for later use
    req.session.pkceCodes = {
      verifier,
      challenge,
      state: cryptoProvider.createNewGuid(),
    };

    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
      responseMode: 'form_post',
      prompt: 'select_account',
      codeChallengeMethod: 'S256',
      codeChallenge: challenge,
      state: req.session.pkceCodes.state,
    };

    try {
      // Get auth code url
      const authCodeUrl = await msalApp.getAuthCodeUrl(authCodeUrlParameters);
      res.redirect(authCodeUrl);
    } catch (error) {
      console.error('Error getting auth code URL:', error);
      res.status(500).send('Error initiating Microsoft authentication');
    }
  });

  // Callback route
  app.post('/api/auth/microsoft/callback', async (req, res) => {
    if (!req.session.pkceCodes) {
      return res.status(400).send('Missing PKCE codes in session');
    }

    const tokenRequest = {
      code: req.body.code,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
      codeVerifier: req.session.pkceCodes.verifier,
      clientInfo: req.body.client_info,
    };

    try {
      // Acquire token with auth code
      const tokenResponse = await msalApp.acquireTokenByCode(tokenRequest);
      
      // Clean up PKCE codes from session
      delete req.session.pkceCodes;
      
      // Store user info in session
      req.session.microsoftUser = {
        idToken: tokenResponse.idToken,
        accessToken: tokenResponse.accessToken,
        account: tokenResponse.account,
        expiresOn: tokenResponse.expiresOn,
      };

      // Upsert user in database
      if (tokenResponse.account) {
        const { name, username, localAccountId } = tokenResponse.account;
        
        // Get email from claims or account
        const email = tokenResponse.account.idTokenClaims?.email || username;
        
        // Split name into first and last name
        const nameParts = name?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await storage.upsertUser({
          id: localAccountId,
          email,
          firstName, 
          lastName,
          profileImageUrl: null, // Microsoft doesn't provide profile image in standard tokens
          authProvider: 'microsoft'
        });
      }
      
      // Redirect to home
      res.redirect('/');
    } catch (error) {
      console.error('Error acquiring token:', error);
      res.status(500).send('Error completing Microsoft authentication');
    }
  });
}

// Middleware to check if user is authenticated with Microsoft
export const isMicrosoftAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.microsoftUser) {
    return res.status(401).json({ message: 'Not authenticated with Microsoft' });
  }
  
  // Check if token is expired
  const expiresOn = req.session.microsoftUser.expiresOn;
  if (expiresOn && new Date() > new Date(expiresOn)) {
    // Token expired, redirect to login
    return res.redirect('/api/login/microsoft');
  }
  
  next();
};