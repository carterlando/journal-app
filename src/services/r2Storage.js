// src/services/r2Storage.js
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * R2 Storage Info Service
 * 
 * Calculates total storage used by current user in R2
 * Why: Track usage against free plan 10GB limit
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;

/**
 * Calculate total storage used by user
 * Recursively lists all objects in user's folder and sums file sizes
 * 
 * @param {string} userId - User ID
 * @returns {Promise<{bytes: number, count: number}>} Total bytes used and file count
 */
export const getUserStorageUsage = async (userId) => {
  try {
    let totalBytes = 0;
    let fileCount = 0;
    let continuationToken = null;

    // List all objects in user's folder with pagination
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${userId}/`, // Only files in this user's folder
        ContinuationToken: continuationToken,
      });

      const response = await r2Client.send(command);

      // Sum up file sizes
      if (response.Contents) {
        for (const object of response.Contents) {
          totalBytes += object.Size || 0;
          fileCount++;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return {
      bytes: totalBytes,
      count: fileCount,
    };

  } catch (error) {
    console.error('Failed to get storage usage:', error);
    throw new Error('Failed to calculate storage usage');
  }
};

/**
 * Format bytes to human-readable size
 * 
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string (e.g., "1.5 GB")
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};