// @ts-nocheck
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser } from '../types';
import { encryptedFieldsPlugin } from '../lib/fieldCrypto';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['entrepreneur', 'admin', 'officer'],
      default: 'entrepreneur',
    },
    // Access control: an admin can switch an account off, which also ends every signed-in session within seconds.
    isActive: { type: Boolean, default: true, index: true },
    deactivatedAt: { type: Date },
    deactivatedBy: { type: String },
    deactivationReason: { type: String, trim: true },
    // Any token issued before this moment is refused (sign out everywhere, deactivation, reactivation).
    sessionsValidFrom: { type: Date },
    // A pending invitation: only a hash of the one-time token is kept.
    invite: {
      tokenHash: { type: String, index: true, sparse: true },
      expiresAt: { type: Date },
      invitedBy: { type: String },
      invitedAt: { type: Date },
    },
    // District a District Reviewer (role 'officer') is assigned to. Set by an admin only.
    reviewDistrict: {
      type: String,
      trim: true,
    },
    udyamNumber: {
      type: String,
      sparse: true,
    },
    location: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    // Held as encrypted text; the plugin below returns it as a Date.
    dateOfBirth: {
      type: String,
    },
    privacy: {
      noticeVersion: { type: String },
      noticeAcceptedAt: { type: Date },
      accountConsent: { type: Boolean, default: false },
      accountConsentAt: { type: Date },
      aiAssist: { type: Boolean, default: false },
      aiAssistAt: { type: Date },
      analytics: { type: Boolean, default: false },
      analyticsAt: { type: Date },
      nominee: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Personal data is encrypted with AES-256-GCM before it reaches the database (needs DATA_ENCRYPTION_KEY).
// Email stays readable because it is the sign-in lookup; name is shown in lists and audit entries.
userSchema.plugin(encryptedFieldsPlugin, {
  paths: ['phoneNumber', 'dateOfBirth', 'privacy.nominee.phone', 'privacy.nominee.email'],
  dates: ['dateOfBirth'],
  lowercase: ['privacy.nominee.email'],
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);

