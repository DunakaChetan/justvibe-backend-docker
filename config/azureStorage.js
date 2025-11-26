// Azure Blob Storage Configuration
// This file provides utilities for Azure Blob Storage operations
// Currently, media files are stored in Azure and URLs are in the database
// This can be used for future file uploads if needed

import dotenv from 'dotenv';

dotenv.config();

export const azureConfig = {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || 'justvibestorage',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'music',
    endpoint: process.env.AZURE_STORAGE_ENDPOINT || 'https://justvibestorage.blob.core.windows.net/',
    // Container names (for reference - URLs are stored in database)
    containers: {
        albums: 'albumimages',
        music: 'music',
        songs: 'songsimages',
        profilePictures: 'profile-pictures'
    }
};

/**
 * Get the full Azure Blob Storage URL for a file
 * @param {string} container - Container name (albums, music, songs, etc.)
 * @param {string} fileName - File name/path
 * @returns {string} Full URL to the blob
 */
export const getAzureBlobUrl = (container, fileName) => {
    const baseUrl = azureConfig.endpoint.replace(/\/$/, ''); // Remove trailing slash
    return `${baseUrl}/${container}/${fileName}`;
};

/**
 * Get container name for a specific type
 * @param {string} type - Type of media (album, music, song, profile)
 * @returns {string} Container name
 */
export const getContainerName = (type) => {
    const typeMap = {
        album: azureConfig.containers.albums,
        albums: azureConfig.containers.albums,
        music: azureConfig.containers.music,
        song: azureConfig.containers.songs,
        songs: azureConfig.containers.songs,
        profile: azureConfig.containers.profilePictures,
        profilePicture: azureConfig.containers.profilePictures
    };
    return typeMap[type.toLowerCase()] || azureConfig.containers.albums;
};

export default azureConfig;

