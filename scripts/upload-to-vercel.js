import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your Vercel blob token
const BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_foeKgHdgnwtAyW0B_9DtqBdXNLFHWglvGMxdH8NszKFel5X';

async function uploadDirectory(localDir, remotePrefix) {
  const fullPath = path.join(__dirname, '..', 'public', localDir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Directory ${fullPath} does not exist`);
    return [];
  }

  const files = fs.readdirSync(fullPath).filter(file => file.endsWith('.webp'));
  console.log(`Found ${files.length} WebP files in ${localDir}`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(fullPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    try {
      console.log(`Uploading ${i + 1}/${files.length}: ${file}`);
      
      const blob = await put(`${remotePrefix}${file}`, fileBuffer, {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
      });

      results.push({
        filename: file,
        url: blob.url
      });

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error);
    }
  }

  return results;
}

async function uploadAllSequences() {
  console.log('Starting upload to Vercel Blob Storage...\n');

  const sequences = [
    {
      localDir: 'OH WEB OPTIMIZED FRAMES/CAST SHADOWS WEBP 1600 85',
      remotePrefix: 'cast-shadows-webp/'
    },
    {
      localDir: 'OH WEB OPTIMIZED FRAMES/FINAL LAPTOP WEBP 90',
      remotePrefix: 'laptop-webp/'
    },
    {
      localDir: 'OH WEB OPTIMIZED FRAMES/INITIAL LOAD WEBP',
      remotePrefix: 'initial-load-webp/'
    },
    {
      localDir: 'OH WEB OPTIMIZED FRAMES/INITIAL SCROLL WEBP',
      remotePrefix: 'initial-scroll-webp/'
    }
  ];

  const allResults = {};

  for (const sequence of sequences) {
    console.log(`\n📁 Uploading ${sequence.localDir}...`);
    const results = await uploadDirectory(sequence.localDir, sequence.remotePrefix);
    allResults[sequence.remotePrefix] = results;
    console.log(`✅ Completed ${sequence.localDir}: ${results.length} files uploaded`);
  }

  // Generate the updated URLs for models-config.js
  console.log('\n🔗 Generated URLs:');
  
  if (allResults['cast-shadows-webp/']?.length > 0) {
    const baseUrl = allResults['cast-shadows-webp/'][0].url.split('/cast-shadows-webp/')[0];
    console.log('\nCast Shadows base URL:', `${baseUrl}/cast-shadows-webp/`);
  }

  if (allResults['laptop-webp/']?.length > 0) {
    const baseUrl = allResults['laptop-webp/'][0].url.split('/laptop-webp/')[0];
    console.log('Laptop base URL:', `${baseUrl}/laptop-webp/`);
  }

  if (allResults['initial-load-webp/']?.length > 0) {
    const baseUrl = allResults['initial-load-webp/'][0].url.split('/initial-load-webp/')[0];
    console.log('Initial Load base URL:', `${baseUrl}/initial-load-webp/`);
  }

  if (allResults['initial-scroll-webp/']?.length > 0) {
    const baseUrl = allResults['initial-scroll-webp/'][0].url.split('/initial-scroll-webp/')[0];
    console.log('Initial Scroll base URL:', `${baseUrl}/initial-scroll-webp/`);
  }

  console.log('\n🎉 Upload complete!');
}

uploadAllSequences().catch(console.error);