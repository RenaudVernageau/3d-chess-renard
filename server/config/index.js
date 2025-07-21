// server/config/index.js
module.exports = {
  PORT: process.env.PORT || 4000,
  // CORS_ORIGIN: process.env.CORS_ORIGIN,

  FRONTEND_URL: process.env.FRONTEND_URL,
  FRONTEND_URL_PREVIEW: process.env.FRONTEND_URL_PREVIEW,
  
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};
