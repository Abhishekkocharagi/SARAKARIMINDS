# SarkariMinds - Testing Checklist ✅

## Quick Verification Steps

### 1. Backend Health Check
- [ ] Backend running on http://localhost:5000
- [ ] MongoDB connected successfully
- [ ] No error messages in backend console
- [ ] API responds: `curl http://localhost:5000` returns "SarkariMinds API is running..."

### 2. Frontend Health Check
- [ ] Frontend running on http://localhost:3000
- [ ] No Turbopack errors
- [ ] Landing page loads correctly
- [ ] No console errors in browser (F12)

### 3. Authentication Flow
- [ ] Can access signup page
- [ ] Can create new account
- [ ] Can log in with credentials
- [ ] Can log out
- [ ] Redirects to login when accessing protected pages while logged out
- [ ] Auto-logout works on 401 errors

### 4. Core Features
- [ ] **Feed Page**
  - [ ] Posts load correctly
  - [ ] Can create new post
  - [ ] Can like/react to posts
  - [ ] Can comment on posts
  - [ ] Exam news sidebar shows
  - [ ] Daily Newspaper section shows in LEFT sidebar below My Exams
  - [ ] Can view newspaper previews
  - [ ] Can open newspaper viewer modal
  - [ ] PDF viewer works for PDF newspapers
  - [ ] Image viewer works for image newspapers
  
- [ ] **Stories**
  - [ ] Can view stories
  - [ ] Can upload new story
  - [ ] Story reactions work
  
- [ ] **Profile**
  - [ ] Can view own profile
  - [ ] Can view other users' profiles
  - [ ] Can edit profile
  
- [ ] **Network**
  - [ ] Can see connection suggestions
  - [ ] Can send connection requests
  - [ ] Can accept/reject requests
  
- [ ] **Messages**
  - [ ] Can view conversations
  - [ ] Can send messages
  - [ ] Can search for users
  
- [ ] **Notifications**
  - [ ] Notifications load
  - [ ] Can mark as read
  - [ ] Notification icons show correctly

### 5. Admin Features (if admin user)
- [ ] Can access admin dashboard
- [ ] Can manage users
- [ ] Can manage mentors
- [ ] Can create exam news
- [ ] Can manage ads
- [ ] **Daily Newspaper Management**
  - [ ] Can access Daily Newspaper admin panel
  - [ ] Can add new newspaper (PDF/Image)
  - [ ] Can edit existing newspapers
  - [ ] Can delete newspapers
  - [ ] Can toggle visibility (show/hide)
  - [ ] Live preview works when adding/editing
  - [ ] View count displays correctly

### 6. Error Handling
- [ ] Helpful error messages show on failures
- [ ] No app crashes on errors
- [ ] Loading states show during API calls
- [ ] Empty states show when no data

### 7. Performance
- [ ] Pages load quickly
- [ ] No lag when scrolling
- [ ] Images load properly
- [ ] Smooth animations

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Solution:** Check if backend is running on port 5000

### Issue: "401 Unauthorized"
**Solution:** Log out and log back in to get fresh token

### Issue: Posts not loading
**Solution:** 
1. Check MongoDB connection
2. Check browser console for errors
3. Verify user is logged in

### Issue: Stories not uploading
**Solution:**
1. Check file size (should be reasonable)
2. Check network connection
3. Verify backend is running

## Browser Testing
Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

## Mobile Responsiveness
- [ ] Test on mobile viewport (DevTools)
- [ ] Navigation works on mobile
- [ ] Forms are usable on mobile

## Final Verification
- [ ] All critical features working
- [ ] No console errors
- [ ] No backend errors
- [ ] User experience is smooth
- [ ] Ready for production/demo

---

**Last Updated:** January 18, 2026
**Status:** All items should pass ✅
