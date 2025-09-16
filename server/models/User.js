// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Schéma utilisateur
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // n'est pas renvoyé par défaut
    },
    avatarUrl: {
      type: String,
      default: "",
    },

    // 🔐 Modération
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
  },
  {
    timestamps: true, // ajoute createdAt et updatedAt automatiques
  }
);

// Hook: avant chaque save, hasher le mot de passe si modifié
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Méthode d'instance pour comparer un mot de passe clair
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
