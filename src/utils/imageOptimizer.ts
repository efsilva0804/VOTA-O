/**
 * Utility to compress and optimize images client-side before storing or transmitting.
 * Prevents Vercel 4.5MB payload limits and browser localStorage 5MB quota exhaustion.
 */
export function compressImageFile(file: File, maxWidth = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawBase64 = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawBase64);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(rawBase64);
      img.src = rawBase64;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes an image URL for display:
 * - If it's a relative URL without leading slash, adds leading slash
 * - If empty, returns fallback
 */
export function normalizeImageUrl(url?: string, fallback = '/images/01.jpeg'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (!trimmed.startsWith('/')) {
    return '/' + trimmed;
  }
  return trimmed;
}
