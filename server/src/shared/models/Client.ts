import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validation: {
      function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // simple email validation
      },
      message: "please enter a valid email address"
    }
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  settings: {
    dataRetentionDays: {
      type: Number,
      default: 30,
      min: 7,
      max: 365
    },
    alertsEnabled: {
      type: Boolean,
      default: false
    },
    timeZone: {
      type: String,
      default: "UTC"
    }
  }
});

const Client = mongoose.model("Client", clientSchema);
export default Client;
