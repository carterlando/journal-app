import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 Upload Service
 * 
 * Handles video uploads to R2 using S3-compatible API
 * Why: R2 has free egress, perfect for streaming videos
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
 * Upload video to R2
 * 
 * @param {Blob} blob - Video blob from recording
 * @param {string} userId - User ID for organizing files
 * @param {string} entryId - Entry ID for unique filename
 * @returns {string} Public URL to the uploaded video
 */
export const uploadVideo = async (blob, userId, entryId) => {
  try {
    // Create filename: userId/year/month/entryId.webm
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const filename = `${userId}/${year}/${month}/${entryId}.webm`;

    // Convert blob to ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: new Uint8Array(arrayBuffer),
      ContentType: 'video/webm',
    });

    await r2Client.send(command);

    // Return the R2 URL (we'll use signed URLs for access)
    const url = import.meta.env.VITE_R2_PUBLIC_URL + filename;
    
    console.log('Video uploaded to R2:', url);
    return url;

  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload video to cloud storage');
  }
};

/**
 * Delete video from R2
 * 
 * @param {string} videoUrl - Full R2 URL of the video
 */
export const deleteVideo = async (videoUrl) => {
  try {
    // Extract filename from URL
    const url = new URL(videoUrl);
    const filename = url.pathname.split(`/${BUCKET_NAME}/`)[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
    });

    await r2Client.send(command);
    console.log('Video deleted from R2:', filename);

  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete video from cloud storage');
  }
};

/**
 * Generate thumbnail from video blob
 * 
 * @param {Blob} videoBlob - Video blob
 * @returns {Promise<Blob>} Thumbnail image blob
 */
export const generateThumbnail = async (videoBlob) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      // Seek to 1 second (or 10% of duration)
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        resolve(blob);
      }, 'image/jpeg', 0.8);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };

    video.src = URL.createObjectURL(videoBlob);
  });
};