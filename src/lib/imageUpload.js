import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const STORAGE_BUCKET = 'putt-assets';
const STORAGE_PUBLIC_PATH_SEGMENT = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image.'));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function dataUrlSize(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCropRect(image, crop = {}) {
  if (!crop || !crop.aspectRatio) {
    return {
      sx: 0,
      sy: 0,
      sw: image.width,
      sh: image.height,
    };
  }

  const aspectRatio = crop.aspectRatio;
  const imageRatio = image.width / image.height;
  const baseWidth = imageRatio > aspectRatio ? image.height * aspectRatio : image.width;
  const baseHeight = imageRatio > aspectRatio ? image.height : image.width / aspectRatio;
  const zoom = clamp(Number(crop.zoom) || 1, 1, 3);
  const cropWidth = clamp(baseWidth / zoom, 1, image.width);
  const cropHeight = clamp(baseHeight / zoom, 1, image.height);
  const offsetX = clamp(Number(crop.offsetX) || 0, -1, 1);
  const offsetY = clamp(Number(crop.offsetY) || 0, -1, 1);
  const maxShiftX = Math.max(0, (image.width - cropWidth) / 2);
  const maxShiftY = Math.max(0, (image.height - cropHeight) / 2);
  const centerX = image.width / 2 + maxShiftX * offsetX;
  const centerY = image.height / 2 + maxShiftY * offsetY;

  return {
    sx: clamp(centerX - cropWidth / 2, 0, image.width - cropWidth),
    sy: clamp(centerY - cropHeight / 2, 0, image.height - cropHeight),
    sw: cropWidth,
    sh: cropHeight,
  };
}

export async function prepareImageForUpload(file, options = {}) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WEBP image.');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image is too large. Please use an image under 2MB.');
  }

  const image = await loadImageFromFile(file);
  const cropRect = getCropRect(image, options.crop);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / cropRect.sw, MAX_IMAGE_HEIGHT / cropRect.sh);
  const width = Math.max(1, Math.round(cropRect.sw * scale));
  const height = Math.max(1, Math.round(cropRect.sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(
    image,
    cropRect.sx,
    cropRect.sy,
    cropRect.sw,
    cropRect.sh,
    0,
    0,
    width,
    height
  );

  let outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let quality = 0.82;
  let dataUrl = canvas.toDataURL(outputType, quality);

  if (dataUrlSize(dataUrl) > MAX_OUTPUT_BYTES) {
    outputType = 'image/jpeg';
    while (quality >= 0.55) {
      dataUrl = canvas.toDataURL(outputType, quality);
      if (dataUrlSize(dataUrl) <= MAX_OUTPUT_BYTES) break;
      quality -= 0.07;
    }
  }

  return dataUrl;
}

function sanitizePathPart(value) {
  return String(value || 'shared')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'shared';
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function mimeFromDataUrl(dataUrl) {
  return dataUrl.split(',')[0]?.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function sanitizeRestaurantFolderName(value) {
  return String(value || 'shared')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'shared';
}

function buildStorageUploadError(error, context) {
  const rawMessage = error?.message || 'Unknown storage error.';
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes('row-level security')) {
    return `Storage upload blocked by Supabase policy. Bucket: "${context.bucket}", path: "${context.path}". Create an INSERT policy for storage.objects that allows this user to upload into that bucket/path.`;
  }

  if (lowerMessage.includes('bucket') && lowerMessage.includes('not found')) {
    return `Supabase Storage bucket "${context.bucket}" was not found. Create that bucket first, then try again.`;
  }

  if (lowerMessage.includes('mime') || lowerMessage.includes('type')) {
    return `Supabase rejected the uploaded file type for "${context.path}". Original error: ${rawMessage}`;
  }

  if (lowerMessage.includes('jwt') || lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
    return `Supabase denied this upload for "${context.path}". Check that the user is authenticated and has Storage permissions for bucket "${context.bucket}".`;
  }

  return `Failed to upload image to Supabase Storage. Bucket: "${context.bucket}", path: "${context.path}". Original error: ${rawMessage}`;
}

export async function uploadImageToStorage(file, options = {}) {
  const processedDataUrl = await prepareImageForUpload(file);
  return uploadPreparedImageToStorage(processedDataUrl, options);
}

export async function uploadPreparedImageToStorage(imageValue, options = {}) {
  if (!imageValue) return '';

  if (!isSupabaseConfigured || !supabase) {
    return imageValue;
  }

  if (!String(imageValue).startsWith('data:image/')) {
    return imageValue;
  }

  const restaurantFolder = sanitizeRestaurantFolderName(options.restaurantName || options.restaurantId || 'shared');
  const entityFolder = sanitizePathPart(options.entityType || 'uploads');
  const mimeType = mimeFromDataUrl(imageValue);
  const extension = extensionFromMime(mimeType);
  const baseName = sanitizePathPart(options.fileBaseName || '');
  const fileName = options.fixedFileName
    ? `${sanitizePathPart(options.fixedFileName)}.${extension}`
    : `${baseName || Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const filePath = entityFolder === 'restaurant-logos'
    ? `${restaurantFolder}/${fileName}`
    : `${restaurantFolder}/${entityFolder}/${fileName}`;
  const uploadContext = { bucket: STORAGE_BUCKET, path: filePath };

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, dataUrlToBlob(imageValue), {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (error) {
    throw new Error(buildStorageUploadError(error, uploadContext));
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || imageValue;
}

export function getStoragePathFromPublicUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null;
  const markerIndex = fileUrl.indexOf(STORAGE_PUBLIC_PATH_SEGMENT);
  if (markerIndex === -1) return null;

  const pathStart = markerIndex + STORAGE_PUBLIC_PATH_SEGMENT.length;
  const pathWithQuery = fileUrl.slice(pathStart);
  const cleanPath = pathWithQuery.split('?')[0].split('#')[0];

  return cleanPath || null;
}

export async function deleteStorageImageByUrl(fileUrl) {
  const storagePath = getStoragePathFromPublicUrl(fileUrl);
  if (!storagePath || !isSupabaseConfigured || !supabase) {
    return false;
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (error) {
    throw new Error(`Failed to delete image from Supabase Storage. Path: "${storagePath}". Original error: ${error.message || 'Unknown storage error.'}`);
  }

  return true;
}

export const imageUploadRules = {
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxUploadBytes: MAX_UPLOAD_BYTES,
  maxOutputBytes: MAX_OUTPUT_BYTES,
  maxWidth: MAX_IMAGE_WIDTH,
  maxHeight: MAX_IMAGE_HEIGHT,
};
