# Firebase Storage CORS Configuration

## Issue
Firebase Storage is blocking uploads from your domain (`https://seasaba.app`) due to CORS policy restrictions.

**Error:**
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'https://seasaba.app' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

## Solution

You need to deploy the CORS configuration to your Firebase Storage bucket.

### Step 1: Install Google Cloud SDK

If you don't have it installed:

**Windows:**
```powershell
# Download and run the installer
# https://cloud.google.com/sdk/docs/install
```

**Mac/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Authenticate with Google Cloud

```bash
gcloud auth login
```

This will open a browser window for you to authenticate with your Google account.

### Step 3: Set Your Project

```bash
gcloud config set project seasabacontracts
```

### Step 4: Deploy CORS Configuration

The `cors.json` file in the project root is already configured. Deploy it:

```bash
gcloud storage buckets update gs://seasabacontracts.firebasestorage.app --cors-file=cors.json
```

**Alternative command format (if the above doesn't work):**
```bash
gsutil cors set cors.json gs://seasabacontracts.firebasestorage.app
```

### Step 5: Verify CORS Configuration

```bash
gcloud storage buckets describe gs://seasabacontracts.firebasestorage.app --format="default(cors_config)"
```

**Or:**
```bash
gsutil cors get gs://seasabacontracts.firebasestorage.app
```

You should see output showing the CORS configuration is active.

### Step 6: Deploy Storage Rules

While you're at it, make sure your storage rules are deployed:

```bash
firebase deploy --only storage
```

## CORS Configuration Details

The `cors.json` file allows:

**Origins:**
- `http://localhost:3000` (local development)
- `https://localhost:3000` (local development with SSL)
- `https://seasaba.app` (production)
- `https://seasaba.appsea-saba-self.vercel.app` (Vercel deployment)

**Methods:**
- GET, POST, PUT, DELETE, HEAD, OPTIONS

**Headers:**
- Content-Type, Authorization, Content-Length, User-Agent, X-Requested-With, Origin

**Cache:**
- 3600 seconds (1 hour)

## Troubleshooting

### Issue: "gcloud: command not found"
**Solution:** Install Google Cloud SDK (see Step 1)

### Issue: "Permission denied"
**Solution:** Make sure you're authenticated with the correct Google account that has access to the Firebase project:
```bash
gcloud auth login
gcloud config set project seasabacontracts
```

### Issue: "Bucket not found"
**Solution:** Verify your bucket name in Firebase Console → Storage. The bucket name should match your Firebase project.

### Issue: CORS still not working after deployment
**Solution:**
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache and hard refresh (Ctrl+Shift+R)
3. Verify deployment with the verify command above
4. Check that your domain is exactly as specified in cors.json

## Testing

After deploying CORS:

1. Go to your hotel details page: `https://seasaba.app/contracts/hotel-staff/hotel`
2. Try uploading a logo
3. Check browser console - CORS error should be gone
4. Logo should upload successfully

## Additional Notes

- CORS configuration is bucket-wide, not per-file
- Changes take effect immediately but may be cached by browsers
- You only need to deploy CORS once unless you change allowed origins
- Storage rules (`storage.rules`) are separate from CORS and also need deployment

## Quick Reference

```bash
# One-time setup
gcloud auth login
gcloud config set project seasabacontracts

# Deploy CORS
gcloud storage buckets update gs://seasabacontracts.firebasestorage.app --cors-file=cors.json

# Deploy storage rules
firebase deploy --only storage

# Verify
gcloud storage buckets describe gs://seasabacontracts.firebasestorage.app --format="default(cors_config)"
```

---

**Last Updated:** March 2026  
**Status:** Pending deployment
