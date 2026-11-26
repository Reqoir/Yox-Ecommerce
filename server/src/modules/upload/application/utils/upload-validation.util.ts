import path from 'path';
import { ApiError } from '../../../../shared/utils/api-error.util';

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_UPLOAD_FILES_COUNT = 10;

export type VerifiedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Strips path traversal segments, null bytes, and control characters from a filename.
 */
export function sanitizeFilename(originalName: string): string {
  const base = path.basename(String(originalName || '').replace(/\0/g, ''));
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned || 'upload';
}

/**
 * Inspects leading magic bytes of a file buffer to determine true raster image format.
 */
export function detectImageTypeFromMagicBytes(buffer: Buffer): VerifiedImageMime | null {
  if (!buffer || buffer.length < 12) {
    // JPEG minimum check (3 bytes)
    if (buffer && buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

function normalizeClaimedMime(mime: string | undefined): string {
  const lower = String(mime || '').toLowerCase().trim();
  if (lower === 'image/jpg') return 'image/jpeg';
  return lower;
}

function expectedMimeForExtension(ext: string): VerifiedImageMime | null {
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return null;
}

/**
 * Validates file extension, claimed MIME type, file size, and magic-byte signature.
 * Rejects SVGs, HTML files, executables, MIME/extension mismatches, and disguised payloads.
 */
export function validateUploadedImageFile(file: {
  originalname?: string;
  mimetype?: string;
  buffer?: Buffer;
  size?: number;
}): { safeFilename: string; verifiedMimeType: VerifiedImageMime } {
  if (!file || !file.originalname) {
    throw ApiError.badRequest('Invalid upload file.');
  }

  // Reject explicit path traversal or null-byte attempts in originalname
  if (file.originalname.includes('\0') || file.originalname.includes('..')) {
    throw ApiError.badRequest('Invalid filename.');
  }

  const safeFilename = sanitizeFilename(file.originalname);
  const ext = path.extname(safeFilename).toLowerCase();

  if (!(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    throw ApiError.badRequest(
      `Unsupported file extension "${ext || 'none'}". Only JPEG, PNG, and WebP images are allowed.`
    );
  }

  const claimedMime = normalizeClaimedMime(file.mimetype);
  if (!ALLOWED_IMAGE_MIMES.has(claimedMime)) {
    throw ApiError.badRequest(
      `Unsupported MIME type "${file.mimetype || 'unknown'}". Only JPEG, PNG, and WebP images are allowed.`
    );
  }

  const extExpectedMime = expectedMimeForExtension(ext);
  if (extExpectedMime !== claimedMime) {
    throw ApiError.badRequest('File extension does not match declared MIME type.');
  }

  if (!file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw ApiError.badRequest('Uploaded file is empty.');
  }

  const actualSize = file.size ?? file.buffer.length;
  if (actualSize > MAX_UPLOAD_FILE_SIZE_BYTES || file.buffer.length > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new ApiError('File size exceeds the maximum allowed limit of 5 MB.', 413);
  }

  const verifiedMimeType = detectImageTypeFromMagicBytes(file.buffer);
  if (!verifiedMimeType) {
    throw ApiError.badRequest('Invalid image signature. File contents do not match a valid JPEG, PNG, or WebP image.');
  }

  if (verifiedMimeType !== claimedMime || verifiedMimeType !== extExpectedMime) {
    throw ApiError.badRequest('File content signature does not match the declared image type.');
  }

  return { safeFilename, verifiedMimeType };
}

/**
 * Returns fixed, server-enforced Cloudinary upload options so client parameters
 * cannot override resource_type, folder, or allowed_formats.
 */
export function buildCloudinaryUploadOptions() {
  return {
    folder: 'yox_ecommerce_products',
    resource_type: 'image' as const,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  };
}
