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
