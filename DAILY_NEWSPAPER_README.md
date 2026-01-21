# Daily Newspaper Feature - Implementation Guide

## Overview
The Daily Newspaper feature allows administrators to upload and manage daily newspapers (PDF or Image format) that students can view directly from their dashboard feed.

## Features Implemented

### User-Side Features ✅
1. **Daily Newspaper Section** - Displayed in the feed page left sidebar, below "My Exams"
2. **Newspaper List** - Shows up to 5 most recent newspapers with:
   - Newspaper name
   - Publication date
   - File type indicator (PDF/Image)
   - Thumbnail preview
   - View count
3. **Full Viewer Modal** - Click on any newspaper to open:
   - PDF Viewer (embedded iframe for PDFs)
   - Image Viewer (full-screen image display)
   - "Open in New Tab" option
   - View tracking (automatically records when user views)

### Admin Panel Features ✅
1. **Daily Newspaper Management Page** (`/admin/daily-newspaper`)
2. **CRUD Operations**:
   - Create new newspaper entries
   - Edit existing newspapers
   - Delete newspapers
   - Toggle visibility (show/hide from users)
3. **Upload Form** with:
   - Newspaper name input
   - Date picker (defaults to current date)
   - File type selector (PDF/Image)
   - File URL input (for cloud-hosted files)
   - Thumbnail URL input (for PDF preview)
   - Live preview panel
4. **Management Table** showing:
   - Thumbnail preview
   - Newspaper details
   - View statistics
   - Visibility status
   - Quick action buttons

## Technical Implementation

### Backend Components

#### 1. Model (`backend/src/models/DailyNewspaper.js`)
```javascript
{
  name: String,           // Newspaper name
  date: Date,             // Publication date
  fileUrl: String,        // URL to PDF or image file
  fileType: String,       // 'pdf' or 'image'
  thumbnailUrl: String,   // Preview image (optional, for PDFs)
  isVisible: Boolean,     // Show/hide toggle
  uploadedBy: ObjectId,   // Admin who uploaded
  views: [ObjectId]       // Users who viewed
}
```

#### 2. Controller (`backend/src/controllers/dailyNewspaperController.js`)
- `getNewspapers()` - Get visible newspapers for users
- `getAllNewspapers()` - Get all newspapers for admin
- `getNewspaperById()` - Get single newspaper
- `createNewspaper()` - Create new newspaper (admin)
- `updateNewspaper()` - Update newspaper (admin)
- `deleteNewspaper()` - Delete newspaper (admin)
- `recordView()` - Track user views
- `toggleVisibility()` - Show/hide newspaper (admin)

#### 3. Routes (`backend/src/routes/dailyNewspaperRoutes.js`)
**User Routes:**
- `GET /api/daily-newspapers` - Get visible newspapers
- `GET /api/daily-newspapers/:id` - Get single newspaper
- `POST /api/daily-newspapers/:id/view` - Record view

**Admin Routes:**
- `GET /api/daily-newspapers/admin/all` - Get all newspapers
- `POST /api/daily-newspapers/admin` - Create newspaper
- `PUT /api/daily-newspapers/admin/:id` - Update newspaper
- `DELETE /api/daily-newspapers/admin/:id` - Delete newspaper
- `PATCH /api/daily-newspapers/admin/:id/toggle-visibility` - Toggle visibility

### Frontend Components

#### 1. User Component (`frontend/src/components/DailyNewspaperSection.tsx`)
- Displays newspaper list in feed sidebar
- Handles newspaper viewing
- Records view tracking
- Modal viewer for PDFs and images

#### 2. Admin Page (`frontend/src/app/admin/daily-newspaper/page.tsx`)
- Full CRUD interface
- Form with live preview
- Statistics dashboard
- Table view with actions

## File Upload Strategy

**Note:** This implementation uses **URL-based file storage**. Files should be uploaded to a cloud storage service (e.g., AWS S3, Cloudinary, Google Cloud Storage) and the URL is stored in the database.

### Recommended Workflow:
1. Admin uploads file to cloud storage
2. Copy the public URL
3. Paste URL in the admin form
4. For PDFs, optionally upload a thumbnail image and paste its URL

### Future Enhancement:
Consider implementing direct file upload with services like:
- Cloudinary
- AWS S3
- Firebase Storage
- Uploadthing

## Usage Guide

### For Admins:

1. **Access Admin Panel**
   - Navigate to `/admin/daily-newspaper`
   - Click "Add Newspaper" button

2. **Add New Newspaper**
   - Enter newspaper name (e.g., "The Hindu - Karnataka Edition")
   - Select date (defaults to today)
   - Choose file type (PDF or Image)
   - Upload file to cloud storage and paste URL
   - For PDFs, optionally add thumbnail URL for preview
   - Click "Create Newspaper"

3. **Manage Newspapers**
   - Click "Edit" to modify details
   - Click visibility toggle to show/hide from users
   - Click "Delete" to remove permanently
   - View statistics (total views)

### For Users:

1. **View Newspapers**
   - Go to Feed page
   - Scroll to right sidebar
   - Find "Daily Newspaper" section below "Exam News"

2. **Read Newspaper**
   - Click on any newspaper card
   - Modal opens with full viewer
   - For PDFs: Use embedded PDF viewer
   - For Images: View full-resolution image
   - Click "Open in New Tab" for external viewing

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/daily-newspapers` | User | Get visible newspapers |
| GET | `/api/daily-newspapers/:id` | User | Get single newspaper |
| POST | `/api/daily-newspapers/:id/view` | User | Record view |
| GET | `/api/daily-newspapers/admin/all` | Admin | Get all newspapers |
| POST | `/api/daily-newspapers/admin` | Admin | Create newspaper |
| PUT | `/api/daily-newspapers/admin/:id` | Admin | Update newspaper |
| DELETE | `/api/daily-newspapers/admin/:id` | Admin | Delete newspaper |
| PATCH | `/api/daily-newspapers/admin/:id/toggle-visibility` | Admin | Toggle visibility |

## Database Schema

```javascript
DailyNewspaper {
  _id: ObjectId,
  name: String (required),
  date: Date (required, default: now),
  fileUrl: String (required),
  fileType: String (required, enum: ['pdf', 'image']),
  thumbnailUrl: String (optional),
  isVisible: Boolean (default: true),
  uploadedBy: ObjectId (ref: 'User', required),
  views: [ObjectId] (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

## Security & Access Control

- ✅ All endpoints require authentication (`protect` middleware)
- ✅ Admin endpoints require admin role (`admin` middleware)
- ✅ Users can only view visible newspapers
- ✅ Admins can view and manage all newspapers
- ✅ View tracking prevents duplicate counts per user

## Testing Checklist

### User Testing:
- [ ] Daily Newspaper section appears in feed sidebar
- [ ] Newspapers load correctly
- [ ] Can click to open viewer modal
- [ ] PDF viewer displays PDFs correctly
- [ ] Image viewer displays images correctly
- [ ] "Open in New Tab" works
- [ ] View count increments
- [ ] Only visible newspapers show

### Admin Testing:
- [ ] Can access `/admin/daily-newspaper`
- [ ] Can create new newspaper
- [ ] Live preview works
- [ ] Can edit newspaper
- [ ] Can delete newspaper
- [ ] Can toggle visibility
- [ ] Statistics display correctly
- [ ] Form validation works

## Known Limitations

1. **File Storage**: Currently uses URL-based storage (not direct upload)
2. **PDF Preview**: Requires manual thumbnail upload for PDFs
3. **File Size**: No file size validation (depends on cloud storage)
4. **Pagination**: Shows only 5 newspapers in user view (can be extended)

## Future Enhancements

1. **Direct File Upload**: Integrate with Cloudinary/S3 for direct uploads
2. **PDF Thumbnail Generation**: Auto-generate thumbnails from PDF first page
3. **Search & Filter**: Add search and date filtering
4. **Categories**: Add newspaper categories (e.g., National, Regional, English, Kannada)
5. **Download Option**: Allow users to download newspapers
6. **Favorites**: Let users bookmark favorite newspapers
7. **Notifications**: Notify users when new newspapers are uploaded
8. **Archive**: Automatic archiving of old newspapers

## Troubleshooting

### Issue: Newspapers not showing in feed
**Solution:**
1. Check if newspapers are marked as visible in admin panel
2. Verify backend is running
3. Check browser console for errors
4. Ensure user is logged in

### Issue: PDF not loading in viewer
**Solution:**
1. Verify PDF URL is publicly accessible
2. Check if URL is correct
3. Try "Open in New Tab" option
4. Some PDFs may have CORS restrictions

### Issue: Admin panel not accessible
**Solution:**
1. Ensure logged in as admin user
2. Check user role in database
3. Verify admin middleware is working

## Files Modified/Created

### Backend:
- ✅ `backend/src/models/DailyNewspaper.js` (new)
- ✅ `backend/src/controllers/dailyNewspaperController.js` (new)
- ✅ `backend/src/routes/dailyNewspaperRoutes.js` (new)
- ✅ `backend/index.js` (modified - added route)

### Frontend:
- ✅ `frontend/src/components/DailyNewspaperSection.tsx` (new)
- ✅ `frontend/src/components/Sidebar.tsx` (modified - added component)
- ✅ `frontend/src/app/admin/daily-newspaper/page.tsx` (new)
- ✅ `frontend/src/app/admin/layout.tsx` (modified - added nav item)

### Documentation:
- ✅ `TESTING_CHECKLIST.md` (updated)
- ✅ `DAILY_NEWSPAPER_README.md` (this file)

---

**Feature Status:** ✅ Fully Implemented and Ready for Testing
**Last Updated:** January 21, 2026
**Developer:** Antigravity AI
