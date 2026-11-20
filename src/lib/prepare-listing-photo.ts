import { MAX_PHOTO_BYTES, MAX_SOURCE_PHOTO_BYTES } from "@/constants/listing-photos";
export async function prepareListingPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size < 1 || file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error("Choose a JPEG, PNG or WebP photo up to 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error("This image is too large. Choose a photo under 40 megapixels.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser couldn’t prepare the image. Try another browser.");
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Couldn’t compress this photo.")), "image/jpeg", 0.85));
    if (blob.size > MAX_PHOTO_BYTES) throw new Error("This photo is still too large. Try a smaller image.");
    return blob;
  } finally { bitmap.close(); }
}
