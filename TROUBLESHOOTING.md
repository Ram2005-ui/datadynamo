# Google Sign-In Troubleshooting Guide

## Common Issues & Solutions

### Issue: "undefined" or "VITE_GOOGLE_CLIENT_ID is not defined"

**Cause**: Environment variable not set

**Solutions**:
1. Create `.env.local` file in project root
2. Add: `VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com`
3. Restart dev server: `npm run dev`
4. Check in browser: Open Console → type `import.meta.env.VITE_GOOGLE_CLIENT_ID`

---

### Issue: Google popup doesn't open

**Cause**: Multiple possibilities

**Check these in order**:
1. **Browser popup blocker?**
   - Check if popup is blocked
   - Whitelist `accounts.google.com`

2. **Incorrect Client ID?**
   - Copy Client ID from Google Cloud Console exactly
   - Should end with `.apps.googleusercontent.com`

3. **Wrong origin?**
   - For local: `http://localhost:5173`
   - For prod: `https://yourdomain.com`
   - Check Google Cloud Console > OAuth settings

4. **Script not loaded?**
   - Open browser DevTools → Network tab
   - Check if `https://accounts.google.com/gsi/client` loads successfully
   - Should have status 200

---

### Issue: "Invalid audience" error when verifying token

**Cause**: Client ID mismatch

**Fix**:
1. Get correct Client ID from Google Cloud Console
2. Set `VITE_GOOGLE_CLIENT_ID` env var (for frontend)
3. Set `GOOGLE_CLIENT_ID` in Supabase function environment
4. Both must match exactly
5. Restart both dev server and Supabase local

---

### Issue: Token verification fails in backend

**Cause**: Multiple possible causes

**Debug steps**:
```typescript
// In Supabase function logs, check for:
1. "Failed to verify token" → Google endpoint not responding
2. "Token audience mismatch" → Client ID incorrect
3. "Token expired" → Clock skew or actual expiration
4. Database error → Check profiles table permissions
```

**Solutions**:
1. Verify Google Client ID is set in Supabase environment
2. Check Supabase logs: Project Settings → Logs → Edge Functions
3. Ensure network can reach `googleapis.com`
4. Check system clock is correct

---

### Issue: "CORS" or "Network" error

**Cause**: Cross-origin request blocked

**For Development**:
1. Check Supabase URL is correct
2. Ensure function endpoint exists
3. Run: `supabase functions list`
4. Should show `google-auth-verify` function

**For Production**:
1. Verify production domain added to Google Cloud Console
2. Check HTTPS is enabled
3. Verify API endpoint is accessible from browser

---

### Issue: User redirects to dashboard but profile not created

**Cause**: Profile creation silently fails or database issue

**Check**:
1. Open Supabase dashboard
2. Go to Browser → profiles table
3. See if new user profile was created
4. Check permissions on profiles table (Row Level Security)

**Solutions**:
1. Verify RLS policies allow insert operations
2. Check table schema matches expected fields:
   - `id` (UUID, references auth.users)
   - `email` (TEXT)
   - `display_name` (TEXT)
   - `avatar_url` (TEXT)
3. Check service role key in Supabase function

---

### Issue: User logs in successfully but session lost on refresh

**Cause**: Session not properly stored

**Check**:
1. Open DevTools → Application → Local Storage
2. Should see `sb-*-auth-token` key
3. If empty, session not saved

**Solutions**:
1. Check localStorage is enabled
2. Verify Supabase client config in `clientRuntime.ts`
3. Ensure `persistSession: true` in Supabase config
4. Check cookie settings in browser

---

### Issue: "Login successful" message doesn't appear

**Cause**: Message cleared before user sees it

**Check**:
1. Is redirect happening immediately?
2. Is auth state updating properly?

**Solutions**:
1. Increase timeout: Change `1000` to `3000` in Auth.tsx line with `setTimeout`
2. Check browser console for errors
3. Verify `user` state is updating in AuthContext

---

### Issue: Google button visible but disabled/grayed out

**Cause**: Component state issue

**Check**:
1. Is another auth operation in progress?
2. Check `googleLoading` or `loading` state

**Solutions**:
1. Wait for any existing auth operation to complete
2. Clear any stuck state by refreshing page
3. Check network tab for hanging requests

---

### Issue: Email/password auth works but Google doesn't

**Cause**: Google OAuth not fully configured

**Check**:
1. Is `signInWithGoogle()` being called?
2. Are there any console errors?

**Solutions**:
1. Check browser console for errors
2. Open Network tab and look for failed requests
3. Verify Google OAuth button click handler
4. Check if Supabase has Google provider enabled

---

### Issue: Error message too generic or confusing

**This is intentional** to prevent information leaks

**For debugging**:
1. Open browser DevTools → Console tab
2. Look for detailed error messages there
3. Check Supabase function logs
4. Contact support with:
   - Screenshot of error
   - Browser console output
   - Supabase function logs

---

### Issue: Multiple sign-in methods cause issues

**Cause**: User signed up with email, trying to login with Google (different accounts)

**Solutions**:
1. Implement account linking (future feature)
2. For now: Use same Google account email as registered email
3. Or: Create new account with Google method

---

## Debug Mode

### Enable Detailed Logging

Add to `/src/lib/googleAuth.ts`:
```typescript
// After imports
const DEBUG = true;

function debug(...args: any[]) {
  if (DEBUG) console.log('[GoogleAuth]', ...args);
}

// Use in functions
debug('Token verified:', data);
debug('User created:', newUser);
```

### Check Auth State

In browser Console:
```javascript
// Import the auth hook (if available in console context)
// Or check via React DevTools

// Check Supabase session
supabase.auth.getSession().then(({ data }) => console.log(data));

// Check user
supabase.auth.getUser().then(({ data }) => console.log(data));

// Check local storage
console.log(localStorage.getItem('sb-lzygdoxveftgcjkipkqy-auth-token'));
```

### Test Token Verification Manually

Using curl (replace values):
```bash
curl -X POST https://your-supabase-url/functions/v1/google-auth-verify \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "your_id_token_here"
  }'
```

---

## Network Analysis

### Check Network Requests

1. Open DevTools → Network tab
2. Perform Google sign-in
3. Look for:
   - `accounts.google.com/gsi/client` - Google SDK (should be 200)
   - `https://accounts.google.com/gsi/*` - Google OAuth requests
   - `google-auth-verify` - Your backend function

### Response Inspection

For `google-auth-verify` requests:
- **200 OK**: Success response
- **400 Bad Request**: Missing or invalid data
- **401 Unauthorized**: Token verification failed
- **500 Internal Server Error**: Backend issue

Click the request → Response tab to see error details.

---

## Performance Issues

### Slow Google Popup

**Check**:
1. Google's servers (check `accounts.google.com` status)
2. Network latency (use Network tab to measure)
3. Browser extensions interfering

**Solutions**:
1. Clear browser cache
2. Disable VPN if using one
3. Try incognito mode
4. Test in different browser

### Slow Verification

**Check**:
1. Function logs: Supabase → Logs
2. Network latency to Google's API
3. Database query performance

**Solutions**:
1. Optimize database query
2. Implement caching (future)
3. Monitor cold starts in Supabase

---

## Production Troubleshooting

### Users can't sign in on production but local works

**Possible causes**:
1. Client ID not set in production environment
2. Domain not added to Google Cloud Console
3. HTTPS not enabled
4. Environment variables not deployed

**Check**:
1. `echo $VITE_GOOGLE_CLIENT_ID` in production
2. Verify domain in Google Cloud OAuth settings
3. Verify HTTPS working: `https://yourdomain.com`
4. Check CloudFront/CDN caching issues

### Intermittent failures

**Possible causes**:
1. Cold starts in Supabase functions
2. Rate limiting from Google
3. Database connection pooling

**Solutions**:
1. Implement retry logic (future)
2. Add error tracking (Sentry)
3. Monitor Supabase metrics

---

## Getting Help

### Information to provide when asking for help

```
1. Screenshot of the error message
2. Browser console output (DevTools → Console)
3. Supabase function logs (Dashboard → Logs → Edge Functions)
4. Network requests from DevTools → Network tab
5. Your Client ID (don't share secret!)
6. Environment configuration (without secrets)
7. Steps to reproduce the issue
8. When it last worked (if applicable)
```

### Where to get help

- **Google OAuth issues**: [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- **Supabase issues**: [Supabase Docs](https://supabase.com/docs)
- **Application issues**: Check this troubleshooting guide first
- **Implementation questions**: See `/GOOGLE_OAUTH_IMPLEMENTATION.md`

---

## Quick Reference

| Problem | Solution |
|---------|----------|
| "undefined" Client ID | Add to `.env.local` |
| Popup doesn't open | Check browser popup blocker |
| "Invalid audience" | Client ID mismatch |
| Profile not created | Check RLS policies |
| Session lost on refresh | Check localStorage |
| Slow verification | Check network/Google API |
| Error on production | Check environment variables |
| Can't select account | Clear browser cache |
| Token expired immediately | Check system clock |
| CORS error | Verify authorized origins |

---

## Still Having Issues?

1. **Check the logs**: Supabase → Logs → Edge Functions
2. **Check network**: DevTools → Network tab
3. **Check browser console**: DevTools → Console
4. **Read the docs**: `/GOOGLE_OAUTH_SETUP.md`
5. **Verify configuration**: All env vars set correctly
6. **Try incognito mode**: Rules out extensions
7. **Clear cache**: Browser cache can cause stale files

Good luck! 🍀
