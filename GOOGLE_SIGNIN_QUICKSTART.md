# Google Sign-In Quick Start

## 5-Minute Setup

### 1. Get Google Client ID (5 min)
```
1. Go to https://console.cloud.google.com/
2. Create new project → Name: "ReguGuard AI"
3. Search APIs → Enable "Google Identity Services API"
4. Credentials → Create OAuth Client ID (Web application)
5. Add Origins:
   - http://localhost:5173 (dev)
   - https://yourdomain.com (prod)
6. Copy your Client ID
```

### 2. Add Environment Variable (1 min)
Create `.env.local` in project root:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### 3. That's It! 🎉
```bash
npm run dev
# Go to http://localhost:5173/auth
# Click "Continue with Google"
```

## What Was Implemented

✅ **Google OAuth 2.0 authentication**
- "Continue with Google" button
- Account selection popup
- Secure token verification

✅ **User Management**
- Automatic profile creation for new users
- Login for existing users
- User data stored in Supabase

✅ **Error Handling**
- Graceful error messages
- No redirect on errors
- Detailed error information in console

✅ **Success Behavior**
- "Login successful" message
- Automatic redirect to /dashboard
- Session maintained on refresh

## File Changes

### New Files
1. `/src/lib/googleAuth.ts` - Google OAuth utilities
2. `/supabase/functions/google-auth-verify/index.ts` - Backend verification
3. `/GOOGLE_OAUTH_SETUP.md` - Full setup guide
4. `/GOOGLE_OAUTH_IMPLEMENTATION.md` - Technical details

### Modified Files
1. `/src/contexts/AuthContext.tsx` - Added Google sign-in
2. `/src/pages/Auth.tsx` - Better error handling & UI

## How It Works

```
User clicks "Continue with Google"
         ↓
Google popup (account selection)
         ↓
Authorization granted
         ↓
Send ID token to backend
         ↓
Backend verifies token & creates user profile
         ↓
Return authentication data
         ↓
Login successful + redirect to dashboard
```

## Environment Variables Needed

| Variable | Value |
|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase key |

*Note: First 2 are already configured in your project*

## Testing Locally

1. Add `.env.local` with `VITE_GOOGLE_CLIENT_ID`
2. Run `npm run dev`
3. Go to `/auth` page
4. Click "Continue with Google"
5. Use your Google account
6. Should see "Login successful" and redirect to dashboard

## Production Deployment

Before going live:
1. Update Google Cloud Console with production domain
2. Update environment variables in your hosting
3. Test on staging first
4. Monitor errors in production

## Common Questions

**Q: Is my Google Client ID secret?**
A: No, it's safe to expose in frontend code.

**Q: Where are tokens stored?**
A: Supabase manages session in localStorage securely.

**Q: Can I use this with other auth providers?**
A: Yes! The same pattern works for GitHub, Microsoft, etc.

**Q: How do I log out?**
A: Click logout → Supabase clears the session automatically.

**Q: What if I forget my setup?**
A: See `/GOOGLE_OAUTH_SETUP.md` for complete instructions.

## Support Files

- **Setup Guide**: `GOOGLE_OAUTH_SETUP.md`
- **Technical Details**: `GOOGLE_OAUTH_IMPLEMENTATION.md`
- **Code**: `/src/lib/googleAuth.ts` & `/src/contexts/AuthContext.tsx`

## Next Steps

1. Get Google Client ID from Google Cloud Console
2. Add to `.env.local`
3. Test locally
4. Deploy to production with updated domain

Happy authenticating! 🔐
