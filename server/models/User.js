// server/models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const { Schema, model } = mongoose;

const userSchema = new Schema({
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
    match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
    _id: false
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare given password with stored hash
userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

module.exports = model('User', userSchema);
