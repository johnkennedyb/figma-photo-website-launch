const crypto = require('crypto');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Client-specific fields
  dateOfBirth: { type: String },
  country: { type: String },
  city: { type: String },
  maritalStatus: { type: String },
  nationality: { type: String },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['client', 'counselor', 'admin'], 
    required: true,
    default: 'client',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false, // Hide this field by default
  },
  emailVerificationTokenExpires: {
    type: Date,
    select: false, // Hide this field by default
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  // Counselor-specific fields
  specialties: [{ type: String }],
  bio: { type: String },
  experience: { type: String },
  education: { type: String },
  certifications: { type: [String] },
  languages: { type: [String] },
  sessionRate: { 
    type: Number, 
    default: 50 
  },
  ngnSessionRate: { 
    type: Number, 
    default: 25000 
  },
  availability: { type: [String] },
  rating: { type: Number, default: 0 },

  // Counselor onboarding fields
  countryOfResidence: { type: String },
  cityOfResidence: { type: String },
  academicQualifications: { type: String },
  relevantPositions: { type: String },
  yearsOfExperience: { type: String },
  issuesSpecialization: { type: String },
  affiliations: { type: String },

});

UserSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expiration to 10 minutes from now
  this.emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000;

  return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);
