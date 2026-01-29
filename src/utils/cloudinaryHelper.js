const cloudinary = require('cloudinary').v2;
const {
    CONTENT_TYPES,
    CLOUDINARY_FOLDERS,
    CLOUDINARY_RESOURCE_TYPES,
    THUMBNAIL
} = require('../constants');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get folder for file type
function getCloudinaryFolder(type) {
    const folderMap = {
        [CONTENT_TYPES.PDF]: CLOUDINARY_FOLDERS.PDFS,
        [CONTENT_TYPES.IMAGE]: CLOUDINARY_FOLDERS.IMAGES,
        [CONTENT_TYPES.VIDEO]: CLOUDINARY_FOLDERS.VIDEOS,
        [CONTENT_TYPES.PRESENTATION]: CLOUDINARY_FOLDERS.PRESENTATIONS
    };
    return folderMap[type] || CLOUDINARY_FOLDERS.OTHER;
}

// Get resource type for Cloudinary
function getResourceType(type) {
    if (type === CONTENT_TYPES.VIDEO) return CLOUDINARY_RESOURCE_TYPES.VIDEO;
    if (type === CONTENT_TYPES.IMAGE) return CLOUDINARY_RESOURCE_TYPES.IMAGE;
    return CLOUDINARY_RESOURCE_TYPES.RAW; // For PDFs and presentations
}

// Upload file to Cloudinary
async function uploadToCloudinary(filePath, type, customPublicId = null) {
    const folder = getCloudinaryFolder(type);
    const resourceType = getResourceType(type);

    const options = {
        folder: folder,
        resource_type: resourceType,
        overwrite: true,
        use_filename: true,
        access_mode: 'public'
    };

    if (customPublicId) {
        options.public_id = customPublicId;
    }

    try {
        const result = await cloudinary.uploader.upload(filePath, options);

        // Generate thumbnail URL
        let thumbnailUrl = result.secure_url;
        const transformation = `/upload/${THUMBNAIL.TRANSFORMATION}/`;

        if (type === CONTENT_TYPES.IMAGE) {
            thumbnailUrl = result.secure_url.replace('/upload/', transformation);
        } else if (type === CONTENT_TYPES.VIDEO) {
            thumbnailUrl = result.secure_url
                .replace('/upload/', transformation)
                .replace(/\.\w+$/, '.jpg');
        } else if (type === CONTENT_TYPES.PDF || type === CONTENT_TYPES.PRESENTATION) {
            // For PDFs and presentations, thumbnails will be generated locally
            // and uploaded separately, so we return the full URL for now
            thumbnailUrl = result.secure_url;
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
