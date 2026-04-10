import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { use } from "react";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validation: {
      function(userName) {
        return /^[a-zA-Z0-9_]+$/.test(userName); // only allow alphanumeric and underscores
      },
      message:
        "please enter a valid username (alphanumeric and underscores only)"
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validation: {
      function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // simple email validation
      },
      message: "please enter a valid email address"
    }
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    maxLength: 12,
    validation: {
      function(password) {
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password); // at least 6 characters, at least one letter and one number
      },
      message:
        "password must be at least 6 characters long and contain at least one letter and one number"
    }
  },
  role: {
    type: String,
    enum: ["super_admin", "client_admin", "client_viewer"],
    default: "client_viewer"
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: function () {
      return this.role !== "super_admin"; // clientId is required for all roles except super_admin
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canCreateApiKeys: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canExportData: {
      type: Boolean,
      default: false
    }
  },
  timeStamp: { type: Date, default: Date.now }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash the password if it has been modified (or is new)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.index({ clientId: 1, isActive: 1 }); // create a compound index on clientId and email to enforce uniqueness
userSchema.index({ role: 1 }); // index on role for faster queries by role
const User = mongoose.model("User", userSchema);

export default User;
