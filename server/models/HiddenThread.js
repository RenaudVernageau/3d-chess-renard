// server/models/HiddenThread.js
const mongoose = require("mongoose");

const hiddenThreadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    otherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hiddenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hiddenThreadSchema.index({ userId: 1, otherId: 1 }, { unique: true });

module.exports = mongoose.models.HiddenThread || mongoose.model("HiddenThread", hiddenThreadSchema);
