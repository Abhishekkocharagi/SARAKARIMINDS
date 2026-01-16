# Testing Password Reset API

## Test the forgot password endpoint

Open your browser console or use this curl command:

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\"}"
```

## Check if backend is running

1. Open browser and go to: http://localhost:5000
2. You should see: "SarkariMinds API is running..."

## Common Issues and Solutions

### Issue 1: Network Error
**Cause**: Backend server not running or not on port 5000
**Solution**: 
- Check if backend is running: `npm run dev` in backend folder
- Check terminal for errors
- Verify port 5000 is not blocked

### Issue 2: Route Not Found (404)
**Cause**: Routes not registered properly
**Solution**:
- Restart backend server (Ctrl+C then `npm run dev`)
- Check index.js has: `app.use('/api/auth', require('./src/routes/passwordResetRoutes'));`

### Issue 3: Email Not Sending
**Cause**: Gmail credentials or "Less secure apps" setting
**Solution**:
- Use Gmail App Password (not regular password)
- Enable 2FA on Gmail
- Generate App Password in Google Account settings
- Update .env with app password

### Issue 4: CORS Error
**Cause**: Frontend can't access backend
**Solution**:
- Backend should have `app.use(cors());`
- Check if CORS is enabled in index.js

## Debug Steps

1. **Check Backend Terminal**
   - Look for "Server running in development mode on port 5000"
   - Look for "MongoDB Connected"
   - Look for any error messages

2. **Check Frontend Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages when clicking "Send Reset Link"

3. **Test Backend Directly**
   - Open: http://localhost:5000
   - Should see: "SarkariMinds API is running..."
   - If not, backend is not running

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Click "Send Reset Link"
   - Look for request to `/api/auth/forgot-password`
   - Check if it's red (failed) or green (success)
   - Click on it to see error details

## Manual Backend Restart

If routes aren't working:

```bash
# Stop backend (Ctrl+C)
# Then restart:
cd "e:\New folder (2)\backend"
npm run dev
```

## Verify Routes Are Loaded

Add this to backend index.js temporarily to see all routes:

```javascript
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
});
```
