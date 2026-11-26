/**
 * @file upload-security.test.ts
 * @description Phase 4 File Upload Security Test Suite
 *
 * Covers:
 *  - Valid JPEG / PNG / WebP uploads succeed with verified MIME & safe Cloudinary options
 *  - HTML disguised as .jpg is rejected (magic-byte mismatch)
 *  - Executable disguised as .png is rejected (magic-byte mismatch)
 *  - SVG containing <script> or onload= is rejected (extension + MIME + magic-byte)
 *  - MIME spoofing (image/png header with JPEG magic bytes or vice versa) is rejected
 *  - Oversized file (>5 MB) is rejected by Multer size limit
 *  - Unsupported extension (.gif, .pdf, .html) is rejected
 *  - Unauthorized customer role receives 403 Forbidden
 *  - Path traversal / malicious filenames are sanitized cleanly
 *  - More than 10 files in batch upload is rejected by Multer file count limit
 *  - Cloudinary upload_stream receives fixed resource_type: 'image' & allowed_formats
 */

import { PassThrough } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import express, { NextFunction, Request, Response } from 'express';
import { ApiError } from '@shared/utils/api-error.util';

const mockUploadCalls: Array<{ dataUri: string; options: Record<string, unknown> }> = [];

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(async (dataUri: string, options: Record<string, unknown>) => {
        mockUploadCalls.push({ dataUri, options });
        return {
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/yox_ecommerce_products/test.jpg',
          public_id: 'yox_ecommerce_products/test',
        };
      }),
    },
  },
}));

let mockAuthUser: { id: string; userId: string; email: string; role: string; tokenVersion: number } | null = {
  id: 'admin-1',
  userId: 'admin-1',
  email: 'admin@yox.com',
  role: 'admin',
  tokenVersion: 1,
};

jest.mock('../../../presentation/http/middleware/require-auth.middleware', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    if (!mockAuthUser) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    req.user = mockAuthUser;
    return next();
  },
}));

const mockFindRoleById = jest.fn(async () => null);
jest.mock('../../roles/infrastructure/repositories/role.repository', () => ({
  RoleRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindRoleById,
  })),
}));

import { uploadRouter as uploadRoutes } from '../presentation/routes/upload.routes';
import {
  buildCloudinaryUploadOptions,
  detectImageTypeFromMagicBytes,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILES_COUNT,
  sanitizeFilename,
  validateUploadedImageFile,
} from '../application/utils/upload-validation.util';

// Minimal valid binary headers for magic-byte verification
const VALID_JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const VALID_PNG_BUFFER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const VALID_WEBP_BUFFER = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from('VP8 ', 'ascii'),
]);

function createTestApp() {
  const app = express();
  app.use('/api/v1/upload', uploadRoutes);
  app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || 500;
    if (status === 500) {
      console.error('UPLOAD TEST 500:', err);
    }
    res.status(status).json({ success: false, message: err.message });
  });
  return app;
}

interface MultipartPart {
  field: string;
  filename: string;
  contentType: string;
  data: Buffer;
}

async function sendMultipartRequest(
  app: express.Express,
  urlPath: string,
  parts: MultipartPart[]
): Promise<{ status: number; body: Record<string, unknown> }> {
  const boundary = '----YoxTestBoundary7MA4YWxkTrZu0gW';
  const chunks: Buffer[] = [];

  for (const part of parts) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${part.field}"; filename="${part.filename}"\r\n` +
          `Content-Type: ${part.contentType}\r\n\r\n`,
        'utf8'
      )
    );
    chunks.push(part.data);
    chunks.push(Buffer.from('\r\n', 'utf8'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

  const payload = Buffer.concat(chunks);
  const socket = new PassThrough();
  (socket as unknown as { remoteAddress?: string }).remoteAddress = '127.0.0.1';
  const req = new IncomingMessage(socket as never);
  req.method = 'POST';
  req.url = urlPath;
  req.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(payload.length),
  };

  const res = new ServerResponse(req);
  const responseChunks: Buffer[] = [];
  const origWrite = res.write.bind(res);
  const origEnd = res.end.bind(res);

  res.write = ((chunk: unknown, ...rest: unknown[]) => {
    if (chunk) {
      responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return (origWrite as (...args: unknown[]) => boolean)(chunk, ...rest);
  }) as typeof res.write;

  return new Promise((resolve, reject) => {
    res.end = ((chunk?: unknown, ...rest: unknown[]) => {
      if (chunk && typeof chunk !== 'function') {
        responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      const result = (origEnd as (...args: unknown[]) => ServerResponse)(chunk, ...rest);
      try {
        const raw = Buffer.concat(responseChunks).toString('utf8');
        const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        resolve({ status: res.statusCode, body });
      } catch (err) {
        reject(err);
      }
      return result;
    }) as typeof res.end;

    app(req as never, res as never);
    setTimeout(() => {
      req.push(payload);
      req.complete = true;
      req.push(null);
    }, 15);
  });
}

describe('Phase 4 Upload Validation Utilities', () => {
  it('detects JPEG, PNG, and WebP magic bytes accurately', () => {
    expect(detectImageTypeFromMagicBytes(VALID_JPEG_BUFFER)).toBe('image/jpeg');
    expect(detectImageTypeFromMagicBytes(VALID_PNG_BUFFER)).toBe('image/png');
    expect(detectImageTypeFromMagicBytes(VALID_WEBP_BUFFER)).toBe('image/webp');
    expect(detectImageTypeFromMagicBytes(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(detectImageTypeFromMagicBytes(Buffer.from('MZ\x90\x00'))).toBeNull();
  });

  it('sanitizes path traversal and special characters in filenames', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('..\\..\\evil<script>.jpg')).toBe('evil_script_.jpg');
    expect(sanitizeFilename('')).toBe('upload');
  });

  it('returns fixed Cloudinary upload options forcing resource_type image', () => {
    const opts = buildCloudinaryUploadOptions();
    expect(opts).toEqual({
      folder: 'yox_ecommerce_products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    });
  });

  it('rejects oversized files (>5MB) in validateUploadedImageFile', () => {
    expect(() =>
      validateUploadedImageFile({
        originalname: 'big.jpg',
        mimetype: 'image/jpeg',
        size: MAX_UPLOAD_FILE_SIZE_BYTES + 1,
        buffer: VALID_JPEG_BUFFER,
      })
    ).toThrow(/5\s*MB/i);
  });
});

describe('Phase 4 Upload Routes & Controller Security', () => {
  const app = createTestApp();

  beforeEach(() => {
    mockUploadCalls.length = 0;
    mockAuthUser = {
      id: 'admin-1',
      userId: 'admin-1',
      email: 'admin@yox.com',
      role: 'admin',
      tokenVersion: 1,
    };
    mockFindRoleById.mockReset();
    mockFindRoleById.mockResolvedValue(null);
  });

  it('allows valid JPEG, PNG, and WebP uploads and passes fixed Cloudinary options', async () => {
    for (const sample of [
      { name: 'photo.jpg', type: 'image/jpeg', buf: VALID_JPEG_BUFFER },
      { name: 'logo.png', type: 'image/png', buf: VALID_PNG_BUFFER },
      { name: 'banner.webp', type: 'image/webp', buf: VALID_WEBP_BUFFER },
    ]) {
      const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
        { field: 'image', filename: sample.name, contentType: sample.type, data: sample.buf },
      ]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    expect(mockUploadCalls).toHaveLength(3);
    for (const call of mockUploadCalls) {
      expect(call.options).toEqual({
        folder: 'yox_ecommerce_products',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      });
    }
  });

  it('rejects HTML file disguised as .jpg (magic-byte mismatch)', async () => {
    const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
      {
        field: 'image',
        filename: 'payload.jpg',
        contentType: 'image/jpeg',
        data: Buffer.from('<!DOCTYPE html><script>alert(1)</script>'),
      },
    ]);
    expect(res.status).toBe(400);
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('rejects Windows executable disguised as .png', async () => {
    const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
      {
        field: 'image',
        filename: 'malware.png',
        contentType: 'image/png',
        data: Buffer.from('MZ\x90\x00\x03\x00\x00\x00'),
      },
    ]);
    expect(res.status).toBe(400);
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('rejects SVG containing <script> and SVG containing onload', async () => {
    for (const svgPayload of [
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'https://evil.test\')"></svg>',
    ]) {
      const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
        {
          field: 'image',
          filename: 'xss.svg',
          contentType: 'image/svg+xml',
          data: Buffer.from(svgPayload),
        },
      ]);
      expect(res.status).toBe(400);
    }
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('rejects MIME spoofing where declared MIME does not match magic bytes', async () => {
    const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
      {
        field: 'image',
        filename: 'spoofed.png',
        contentType: 'image/png',
        data: VALID_JPEG_BUFFER,
      },
    ]);
    expect(res.status).toBe(400);
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('rejects oversized file (>5 MB) cleanly with 413', async () => {
    const oversized = Buffer.concat([VALID_JPEG_BUFFER, Buffer.alloc(MAX_UPLOAD_FILE_SIZE_BYTES + 1024)]);
    const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
      {
        field: 'image',
        filename: 'huge.jpg',
        contentType: 'image/jpeg',
        data: oversized,
      },
    ]);
    expect(res.status).toBe(413);
    expect(String(res.body.message)).toMatch(/5\s*MB|large/i);
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('rejects unsupported extensions (.gif, .pdf, .html)', async () => {
    for (const ext of ['anim.gif', 'doc.pdf', 'page.html']) {
      const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
        {
          field: 'image',
          filename: ext,
          contentType: 'image/png',
          data: VALID_PNG_BUFFER,
        },
      ]);
      expect(res.status).toBe(400);
    }
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('returns 403 Forbidden for customer role and 401 when unauthenticated', async () => {
    mockAuthUser = {
      id: 'cust-1',
      userId: 'cust-1',
      email: 'customer@example.com',
      role: 'customer',
      tokenVersion: 1,
    };
    const forbiddenRes = await sendMultipartRequest(app, '/api/v1/upload/image', [
      { field: 'image', filename: 'photo.jpg', contentType: 'image/jpeg', data: VALID_JPEG_BUFFER },
    ]);
    expect(forbiddenRes.status).toBe(403);

    mockAuthUser = null;
    const unauthRes = await sendMultipartRequest(app, '/api/v1/upload/image', [
      { field: 'image', filename: 'photo.jpg', contentType: 'image/jpeg', data: VALID_JPEG_BUFFER },
    ]);
    expect(unauthRes.status).toBe(401);
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('sanitizes malicious filename while accepting valid image content', async () => {
    const res = await sendMultipartRequest(app, '/api/v1/upload/image', [
      {
        field: 'image',
        filename: '../../<img src=x onerror=alert(1)>.png',
        contentType: 'image/png',
        data: VALID_PNG_BUFFER,
      },
    ]);
    expect(res.status).toBe(200);
    expect(mockUploadCalls).toHaveLength(1);
  });

  it('rejects batch uploads exceeding 10 files', async () => {
    const parts: MultipartPart[] = [];
    for (let i = 0; i < MAX_UPLOAD_FILES_COUNT + 1; i++) {
      parts.push({
        field: 'images',
        filename: `img-${i}.jpg`,
        contentType: 'image/jpeg',
        data: VALID_JPEG_BUFFER,
      });
    }
    const res = await sendMultipartRequest(app, '/api/v1/upload/images', parts);
    expect(res.status).toBe(400);
    expect(String(res.body.message)).toMatch(/10/);
    expect(mockUploadCalls).toHaveLength(0);
  });

  it('validates batch route independently: accepts valid batch, rejects disguised file in batch, and enforces 403 for customer', async () => {
    const validRes = await sendMultipartRequest(app, '/api/v1/upload/images', [
      { field: 'images', filename: 'one.jpg', contentType: 'image/jpeg', data: VALID_JPEG_BUFFER },
      { field: 'images', filename: 'two.png', contentType: 'image/png', data: VALID_PNG_BUFFER },
    ]);
    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(mockUploadCalls).toHaveLength(2);

    mockUploadCalls.length = 0;
    const mixedBadRes = await sendMultipartRequest(app, '/api/v1/upload/images', [
      { field: 'images', filename: 'one.jpg', contentType: 'image/jpeg', data: VALID_JPEG_BUFFER },
      { field: 'images', filename: 'evil.jpg', contentType: 'image/jpeg', data: Buffer.from('<script>alert(1)</script>') },
    ]);
    expect(mixedBadRes.status).toBe(400);
    expect(mockUploadCalls).toHaveLength(0);

    mockAuthUser = {
      id: 'cust-1',
      userId: 'cust-1',
      email: 'customer@example.com',
      role: 'customer',
      tokenVersion: 1,
    };
    const custBatchRes = await sendMultipartRequest(app, '/api/v1/upload/images', [
      { field: 'images', filename: 'one.jpg', contentType: 'image/jpeg', data: VALID_JPEG_BUFFER },
    ]);
    expect(custBatchRes.status).toBe(403);
    expect(mockUploadCalls).toHaveLength(0);
  });
});
