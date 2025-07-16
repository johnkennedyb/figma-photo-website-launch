const mongoose = require('mongoose');

const counselorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Personal Information
  nationality: { type: String },
  countryOfResidence: { type: String },
  cityOfResidence: { type: String },
  maritalStatus: { type: String },
  dateOfBirth: { type: Date },

  // Qualifications
  university: { type: String },
  licenseNumber: { type: String },
  fieldOfSpecialization: { type: String },
  yearsOfExperience: { type: Number },

  // Specializations and Languages
  specializations: [{ type: String }],
  languages: [{ type: String }],

  // About
  bio: { type: String },

  // Admin & System Fields
  sessionRate: { type: Number, default: 50 },
  ngnSessionRate: { type: Number, default: 25000 },
  isApproved: { type: Boolean, default: false },
  profilePicture: { type: String },
  availability: {
    type: Map,
    of: [String],
  },
}, { timestamps: true });

module.exports = mongoose.model('Counselor', counselorSchema);
