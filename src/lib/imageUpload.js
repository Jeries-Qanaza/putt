const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;

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

export const imageUploadRules = {
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxUploadBytes: MAX_UPLOAD_BYTES,
  maxOutputBytes: MAX_OUTPUT_BYTES,
  maxWidth: MAX_IMAGE_WIDTH,
  maxHeight: MAX_IMAGE_HEIGHT,
};
