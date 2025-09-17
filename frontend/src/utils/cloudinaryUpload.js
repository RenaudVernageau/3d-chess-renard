// src/utils/cloudinaryUpload.js

/**
 * Envoie un fichier directement à Cloudinary avec la signature serveur
 * @param {File|Blob} file
 * @param {{apiKey:string,cloudName:string,folder:string,publicId:string,timestamp:number,signature:string}} sig
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadFileToCloudinary(file, sig) {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", sig.timestamp);
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("public_id", sig.publicId);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
  const resp = await fetch(url, { method: "POST", body: form });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${resp.status} ${txt}`);
  }
  return resp.json();
}

/**
 * Envoie un fichier à Cloudinary en mode **unsigned** (upload preset requis)
 * @param {File|Blob} file
 * @param {{ cloudName?: string, uploadPreset?: string, folder?: string, publicId?: string }} opts
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadFileToCloudinaryUnsigned(file, opts = {}) {
  const cloudName = opts.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    opts.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS;
  const folder = opts.folder || "avatars";
  const publicId = opts.publicId;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary config missing for unsigned upload (cloudName/uploadPreset)."
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (folder) form.append("folder", folder);
  if (publicId) form.append("public_id", publicId);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const resp = await fetch(url, { method: "POST", body: form });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(
      data?.error?.message ||
        `Cloudinary unsigned upload failed (${resp.status})`
    );
  }
  return data; // { secure_url, public_id, ... }
}

/**
 * (Optionnel) génère une URL Cloudinary optimisée (miniature carrée)
 * Exemple : makeAvatarUrl(secureUrl, 128)
 */
export function makeAvatarUrl(secureUrl, size = 128) {
  if (!secureUrl || typeof secureUrl !== "string") return secureUrl;
  // insère /w_{size},h_{size},c_fill,f_auto,q_auto/ juste après '/upload/'
  return secureUrl.replace(
    /\/upload\/(v\d+\/)?/,
    (_m, v) => `/upload/w_${size},h_${size},c_fill,f_auto,q_auto/${v || ""}`
  );
}
