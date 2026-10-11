export function prepareAvatarImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Choose a JPG, PNG, or WebP image.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Choose an image smaller than 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read this image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('This file is not a valid image.'));
      image.onload = () => {
        const scale = Math.min(1, 256 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        if (dataUrl.length > 170 * 1024) {
          reject(new Error('The processed image is too large. Choose a simpler image.'));
          return;
        }
        resolve(dataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
