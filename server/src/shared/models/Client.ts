import { Schema, model } from "mongoose";

export interface IClient {
  name: string;
  slug: string;
  email: string;
  description: string;
  website: string;
  createdBy: Schema.Types.ObjectId;
  isActive: boolean;
  settings: {
    dataRetentionDays: number;
    alertsEnabled: boolean;
    timeZone: string;
  };
  timestamp: Date;
}

const clientSchema = new Schema<IClient>({
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
    validate: {
      validator: (email: string) => {
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
    type: Schema.Types.ObjectId,
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
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Client = model("Client", clientSchema);
export default Client;
