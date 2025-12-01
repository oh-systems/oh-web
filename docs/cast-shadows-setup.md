# Cast Shadows Images - Vercel Blob Setup

## Setup Instructions

### 1. Get Your Vercel Blob Token
1. Visit [Vercel Dashboard > Storage](https://vercel.com/dashboard/stores)
2. Create a new Blob store or use existing one
3. Copy your `BLOB_READ_WRITE_TOKEN`

### 2. Set Environment Variables

**For Upload Script (local):**
```bash
export BLOB_READ_WRITE_TOKEN="your_token_here"
```

**For Next.js App (.env.local):**
```bash
BLOB_READ_WRITE_TOKEN=your_token_here
NODE_ENV=production  # Set this to use external URLs
```

### 3. Upload Images
```bash
# Make sure you're in the project root
cd /Users/josework/Desktop/Projects/oh-web

# Run the upload script
node scripts/upload-cast-shadows.mjs
```

### 4. Update Your App
After successful upload, the script will generate `public/cast-shadows-urls.json` with all the CDN URLs.

## Configuration

The app automatically switches between local and external images based on `NODE_ENV`:

- **Development** (`NODE_ENV=development`): Uses local images from `/public/images/models/SECOND CAST SHADOWS/`
- **Production** (`NODE_ENV=production`): Uses Vercel Blob CDN URLs

## File Structure
```
scripts/
  upload-cast-shadows.mjs     # Upload script
lib/
  cast-shadows-config.js      # Configuration and URL management
public/
  cast-shadows-urls.json      # Generated URL mapping (after upload)
  images/models/SECOND CAST SHADOWS/  # Local images (for development)
```

## Fallback Strategy
If external CDN fails to load an image, the app will automatically fallback to local images (if available).

## Benefits
✅ Reduced repo size (no large images in git)
✅ Fast global CDN delivery
✅ Automatic optimization by Vercel
✅ Seamless local development
✅ Fallback to local images if needed