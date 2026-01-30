# Google OAuth 2.0 Setup Guide

This guide explains how to configure Google Sign-In for your ReguGuard AI application.

## 1. Setup Google Cloud Project

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "ReguGuard AI")
4. Click "Create"

### Step 2: Enable Google Identity Services API
1. In the Google Cloud Console, go to APIs & Services → Library
2. Search for "Google Identity Services API"
3. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth Client ID"
3. Select "Web application"
4. Give it a name (e.g., "ReguGuard Frontend")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (alternative dev port)
   - `https://yourdomain.com` (your production domain)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:5173/` (for local development)
   - `https://yourdomain.com/` (your production domain)
7. Click "Create"
8. Copy your **Client ID** (you'll need this)

## 2. Configure Environment Variables

### In your `.env` file or `.env.local`:
```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Supabase Configuration (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### In Supabase (Backend):
Create a Supabase function environment variable for Google Client ID:

Go to Supabase Dashboard:
1. Project Settings → Edge Functions → Environment Variables
2. Add new variable:
   - Name: `GOOGLE_CLIENT_ID`
   - Value: `your_google_client_id_here`

## 3. Supabase OAuth Configuration (Optional)

If you want to use Supabase's built-in Google OAuth provider instead:

1. Go to Supabase Dashboard
2. Authentication → Providers
3. Find "Google" and click "Enable"
4. Enter your Google Client ID and Client Secret (from Google Cloud Console)
5. Save

## 4. Database Setup

The application uses these tables (auto-created by migrations):
- `profiles` - User profile information
- Sessions are managed by Supabase Auth

## 5. Testing the Integration

### Local Testing:
1. Make sure your `.env` file has `VITE_GOOGLE_CLIENT_ID` set
2. Start the development server: `npm run dev`
3. Navigate to the Auth page
4. Click "Continue with Google"
5. Follow the Google authentication flow
6. You should be redirected to the dashboard on success

### Testing User Creation:
- New users will automatically get a profile created in the `profiles` table
- Returning users will log in directly

### Error Handling:
The implementation handles these error cases:
- Popup closed during authentication
- Permission denied
- Token verification failure
- Network errors

## 6. Security Considerations

### Frontend:
- Google Client ID is public (it's safe to expose)
- Never store actual tokens in localStorage (Supabase handles this)

### Backend:
- ID tokens are verified on the server-side
- Environment variables (Google Client ID) are secure in Supabase

### Best Practices:
1. Always verify tokens on the backend
2. Use HTTPS in production
3. Keep Google Cloud credentials secure
4. Monitor authentication logs
5. Implement rate limiting on auth endpoints

## 7. Troubleshooting

### "Invalid audience" error:
- Verify your Google Client ID is correct
- Make sure redirect URIs match exactly

### "Token expired" error:
- Clear browser cookies and try again
- Check system time synchronization

### Popup not opening:
- Check browser popup blockers
- Verify callback URLs are correctly configured

### User not created:
- Check Supabase profiles table permissions
- Verify service role key has proper access

## 8. File Structure

The Google OAuth implementation consists of:
- `/src/lib/googleAuth.ts` - Google authentication utilities
- `/src/contexts/AuthContext.tsx` - Authentication context and hooks
- `/src/pages/Auth.tsx` - Authentication UI
- `/supabase/functions/google-auth-verify/index.ts` - Backend verification function

## 9. Production Deployment

Before deploying to production:
1. Update environment variables in your hosting platform
2. Add production domain to Google Cloud OAuth credentials
3. Enable HTTPS
4. Update Supabase function environment variables
5. Test the complete flow on staging
6. Monitor authentication errors in production

## Support

For issues with:
- **Google OAuth**: See [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Supabase Auth**: See [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- **Application**: Check browser console for detailed error messages
