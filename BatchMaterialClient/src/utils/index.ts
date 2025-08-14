export const getAssetURL = (path: string) => {
  return new URL(`../assets/images/${path}`, import.meta.url).href;
};

/** 格式化文件大小 */
export const formatFileSize = (bytes: number, decimals: number = 3): string => {
  if (bytes !== 0 && !bytes) return '未知大小';

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/** 传入图片链接，将图片转为File */
export const imageToFile = (url: string, name: string = 'image.png') => {
  return new Promise<File>(async (resolve, rejects) => {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0, img.width, img.height);

        canvas.toBlob(blob => {
          if (!blob) rejects(null);

          const file = new File([blob as BlobPart], name, {
            type: 'image/png',
            lastModified: Date.now()
          });

          resolve(file);
        }, 'image/png');
      } else {
        rejects(null);
      }
    };
  });
};
