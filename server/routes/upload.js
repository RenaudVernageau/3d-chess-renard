const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // garde la même auth que le reste de ton app
const crypto = require("crypto");

// POST /api/upload/signature
// Retourne { timestamp, signature, apiKey, cloudName, folder, publicId }
router.post("/signature", auth, async (req, res) => {
  try {
    const userId = req.user?.id || "anon";
    const folder = (req.body?.folder || `users/${userId}`).replace(/[^a-zA-Z0-9/_-]/g, "");
    const publicId = (req.body?.publicId || `avatar_${Date.now()}`).replace(/[^a-zA-Z0-9/_-]/g, "");
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = { folder, public_id: publicId, timestamp };

    const toSign = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(toSign + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      publicId,
    });
  } catch (e) {
    console.error("[upload] signature error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
