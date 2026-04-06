# CMS Image Management Guide

## Quick Start: Adding Custom Event Images

### Option 1: Use Public CDN URLs (Current Setup)
All events currently use Unsplash URLs which are free, high-quality, and reliable:
```javascript
image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800'
```

### Option 2: Store Images Locally in Public Folder
1. Save image to: `/public/images/we-love-eya.jpg`
2. Update event in database:
```sql
UPDATE cms_events 
SET image_url = '/images/we-love-eya.jpg'
WHERE title = 'We Love Eya 2026';
```

### Option 3: Upload to Supabase Storage
1. Use Supabase client to upload:
```javascript
const { data, error } = await supabase.storage
  .from('cms-images')
  .upload('events/we-love-eya.jpg', file);
```

2. Update event with storage URL:
```sql
UPDATE cms_events 
SET image_url = 'https://[project].supabase.co/storage/v1/object/public/cms-images/events/we-love-eya.jpg'
WHERE title = 'We Love Eya 2026';
```

## Current Demo Data Status

✅ **All 10 events seeded and published**
✅ **3 news articles with images**
✅ **3 announcements added**
✅ **3 hero banners configured**
✅ **All using Unsplash URLs** (professional, no copyright issues)

## To Replace Event Images

Using the CMS Admin Panel (`/admin/cms`):
1. Click "Edit" on any event
2. Update the `image_url` field with your new image URL
3. Click "Save"
4. Changes take effect immediately

## Bulk Update Images

Via direct SQL:
```bash
psql -h db.zsuszjlgatsylleuopff.supabase.co -U postgres -d postgres << 'EOF'
UPDATE cms_events 
SET image_url = '/images/custom/' || LOWER(REPLACE(title, ' ', '-')) || '.jpg'
WHERE image_url LIKE 'https://images.unsplash%';
EOF
```

## Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

## Image Size Recommendations
- **Events**: 800x600px (16:9 aspect ratio)
- **News**: 800x450px (16:9 aspect ratio)
- **Banners**: 1200x400px (3:1 aspect ratio)
- **Max file size**: 5MB per image
