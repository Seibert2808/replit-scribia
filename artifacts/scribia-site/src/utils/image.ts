export async function keyBlackToTransparent(url: string, threshold = 30): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Ensure canvas is allowed to read pixels
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Chroma key: turn near-black pixels transparent
        const t = Math.max(0, Math.min(255, threshold));
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // If pixel is very dark (close to black), make it transparent
          if (r < t && g < t && b < t) {
            data[i + 3] = 0; // alpha
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const out = canvas.toDataURL("image/png");
        resolve(out);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
