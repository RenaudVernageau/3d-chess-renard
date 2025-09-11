// src/api/upload.js
import api from "../api";

/**
 * Récupère une signature d’upload Cloudinary côté serveur
 * Retourne : { timestamp, signature, apiKey, cloudName, folder, publicId }
 */
export async function getCloudinarySignature({ folder, publicId } = {}) {
  return api("/upload/signature", {
    method: "POST",
    body: { folder, publicId },
  });
}
