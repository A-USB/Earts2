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
      image.onload = async () => {
        try {
          for (const dimension of [256, 192, 128]) {
            const scale = Math.min(1, dimension / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Image processing is not available in this browser.');
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            for (const quality of [0.82, 0.68, 0.54]) {
              const blob = await new Promise(resolveBlob => canvas.toBlob(resolveBlob, 'image/webp', quality));
              if (!blob) continue;
              if (blob.size <= 120 * 1024) {
                const dataUrl = await new Promise((resolveData, rejectData) => {
                  const output = new FileReader();
                  output.onerror = () => rejectData(new Error('Unable to process this image.'));
                  output.onload = () => resolveData(output.result);
                  output.readAsDataURL(blob);
                });
                resolve(dataUrl);
                return;
              }
            }
          }
          reject(new Error('This image could not be compressed enough. Try a smaller photo.'));
        } catch (error) {
          reject(error);
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
