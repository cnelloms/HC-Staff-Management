import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { storage } from './storage';
import { credentials } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Direct server-side login form
router.get('/emergency', (req, res) => {
  // Check if already logged in
  if (req.session?.directUser) {
    return res.redirect('/');
  }
  
  // Show login form with potential error message
  const error = req.query.error ? String(req.query.error) : '';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Emergency Login</title>
      <style>
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          width: 90%;
          max-width: 400px;
        }
        h1 { 
          margin-top: 0; 
          color: #333;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 1rem;
        }
        .description {
          margin-bottom: 1.5rem;
          color: #555;
          font-size: 0.9rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        input {
          display: block;
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          box-sizing: border-box;
        }
        button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
          font-size: 1rem;
        }
        button:hover { background: #0060df; }
        .error {
          background: #fff5f5;
          color: #e53e3e;
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
          display: ${error ? 'block' : 'none'};
          border-left: 4px solid #e53e3e;
        }
        .back-link {
          display: block;
          text-align: center;
          margin-top: 1rem;
          color: #666;
          text-decoration: none;
        }
        .back-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Emergency Login</h1>
        
        <div class="description">
          Use this form if you're experiencing issues with the normal login page.
          This bypasses client-side authentication.
        </div>
        
        <div class="error" id="errorMessage">
          ${error}
        </div>
        
        <form action="/auth/login-handler" method="POST">
          <div>
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="Enter your username" required autocomplete="username">
          </div>
          
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required autocomplete="current-password">
          </div>
          
          <button type="submit">Login</button>
        </form>
        
        <a href="/" class="back-link">Return to homepage</a>
      </div>
    </body>
    </html>
  `);
});

// Handle the login form submission
router.post('/login-handler', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.redirect('/auth/emergency?error=Username and password are required');
    }
    
    console.log('Emergency login attempt with username:', username);
    
    // Retrieve user credentials
    const [userCredentials] = await db.select()
      .from(credentials)
      .where(eq(credentials.username, username));
      
    if (!userCredentials) {
      console.log('No credentials found for username:', username);
      return res.redirect('/auth/emergency?error=Invalid username or password');
    }
    
    if (userCredentials.isEnabled === false) {
      return res.redirect('/auth/emergency?error=This account has been disabled');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userCredentials.passwordHash);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for:', username);
      return res.redirect('/auth/emergency?error=Invalid username or password');
    }
    
    // Get user details
    const user = await storage.getUser(userCredentials.userId);
    
    if (!user) {
      return res.redirect('/auth/emergency?error=User account not found');
    }
    
    // Update last login time
    await db.update(credentials)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(credentials.id, userCredentials.id));
    
    // Set session data
    req.session.directUser = {
      id: user.id,
      username: userCredentials.username,
      isAdmin: user.isAdmin === true
    };
    
    // Log the login details for debugging
    console.log('Emergency login successful for:', username);
    console.log('Session data:', req.session.directUser);
    
    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/auth/emergency?error=Error saving session data');
      }
      
      // Redirect to home page
      return res.redirect('/');
    });
  } catch (error) {
    console.error('Emergency login error:', error);
    return res.redirect('/auth/emergency?error=An unexpected error occurred');
  }
});

export default router;