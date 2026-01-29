const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get folder for file type
function getCloudinaryFolder(type) {
    const folders = {
        'pdf': 'scout/pdfs',
        'image': 'scout/images',
        'video': 'scout/videos',
        'presentation': 'scout/presentations'
    };
    return folders[type] || 'scout/other';
}

// Get resource type for Cloudinary
function getResourceType(type) {
    if (type === 'video') return 'video';
    if (type === 'image') return 'image';
    return 'raw'; // For PDFs and presentations
}

// Upload file to Cloudinary
async function uploadToCloudinary(filePath, type, customPublicId = null) {
    const folder = getCloudinaryFolder(type);
    const resourceType = getResourceType(type);

    const options = {
        folder: folder,
        resource_type: resourceType,
        overwrite: true,
        use_filename: true
    };

    if (customPublicId) {
        options.public_id = customPublicId;
    }

    try {
        const result = await cloudinary.uploader.upload(filePath, options);

        // Generate thumbnail URL
        let thumbnailUrl = result.secure_url;
        if (type === 'image') {
            thumbnailUrl = result.secure_url.replace('/upload/', '/upload/c_thumb,w_300,h_300/');
        } else if (type === 'video') {
            thumbnailUrl = result.secure_url.replace('/upload/', '/upload/c_thumb,w_300,h_300/').replace(/\.\w+$/, '.jpg');
        } else if (type === 'pdf') {
            // PDFs uploaded as raw can't generate thumbnails, use placeholder
            thumbnailUrl = 'https://res.cloudinary.com/du7ltlmlh/image/upload/v1769658672/scout/placeholders/pdf-icon.svg';
        } else if (type === 'presentation') {
            // Presentations uploaded as raw can't generate thumbnails, use placeholder
            thumbnailUrl = 'https://res.cloudinary.com/du7ltlmlh/image/upload/v1769658674/scout/placeholders/ppt-icon.svg';
        }

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            thumbnailUrl: thumbnailUrl
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Delete file from Cloudinary
async function deleteFromCloudinary(publicId, resourceType = 'image') {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return { success: true };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
}

// Get public ID from Cloudinary URL
function getPublicIdFromUrl(url) {
    try {
        // URL format: https://res.cloudinary.com/cloud_name/type/upload/v1234567890/folder/filename.ext
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;

        // Remove version and get the rest as public ID
        const pathPart = parts[1].replace(/^v\d+\//, '');
        // Remove file extension
        const publicId = pathPart.replace(/\.\w+$/, '');
        return publicId;
    } catch (error) {
        return null;
    }
}

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    getCloudinaryFolder,
    getResourceType,
    getPublicIdFromUrl
};
