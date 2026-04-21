import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const STORAGE_BUCKET = 'putt-assets';

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

export async function prepareImageForUpload(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WEBP image.');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image is too large. Please use an image under 2MB.');
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

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

export async function uploadImageToStorage(file, options = {}) {
  const processedDataUrl = await prepareImageForUpload(file);

  if (!isSupabaseConfigured || !supabase) {
    return processedDataUrl;
  }

  const restaurantFolder = sanitizePathPart(options.restaurantId || 'shared');
  const entityFolder = sanitizePathPart(options.entityType || 'uploads');
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const filePath = `${restaurantFolder}/${entityFolder}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, dataUrlToBlob(processedDataUrl), {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload image to storage.');
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || processedDataUrl;
}

export const imageUploadRules = {
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxUploadBytes: MAX_UPLOAD_BYTES,
  maxOutputBytes: MAX_OUTPUT_BYTES,
  maxWidth: MAX_IMAGE_WIDTH,
  maxHeight: MAX_IMAGE_HEIGHT,
};
