const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a simple SVG PDF icon and upload it
const pdfIconSvg = `data:image/svg+xml;base64,${Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#f3f4f6"/>
  <rect x="60" y="30" width="180" height="240" rx="10" fill="#ef4444"/>
  <polygon points="180,30 240,90 180,90" fill="#dc2626"/>
  <text x="150" y="180" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">PDF</text>
</svg>
`).toString('base64')}`;

const pptIconSvg = `data:image/svg+xml;base64,${Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <rect width="300" height="300" fill="#f3f4f6"/>
  <rect x="60" y="30" width="180" height="240" rx="10" fill="#f97316"/>
  <polygon points="180,30 240,90 180,90" fill="#ea580c"/>
  <text x="150" y="180" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle">PPT</text>
</svg>
`).toString('base64')}`;

async function uploadPlaceholders() {
    console.log('Uploading PDF placeholder...');
    try {
        const pdfResult = await cloudinary.uploader.upload(pdfIconSvg, {
            folder: 'scout/placeholders',
            public_id: 'pdf-icon',
            resource_type: 'image',
            overwrite: true
        });
        console.log('✅ PDF icon uploaded:', pdfResult.secure_url);

        console.log('Uploading PPT placeholder...');
        const pptResult = await cloudinary.uploader.upload(pptIconSvg, {
            folder: 'scout/placeholders',
            public_id: 'ppt-icon',
            resource_type: 'image',
            overwrite: true
        });
        console.log('✅ PPT icon uploaded:', pptResult.secure_url);

        console.log('\n✅ All placeholders uploaded successfully!');
    } catch (error) {
        console.error('❌ Upload error:', error.message);
    }
}

uploadPlaceholders();
