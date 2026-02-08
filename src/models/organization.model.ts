import mongoose, { Document, Schema } from "mongoose";
import { Organization } from "../types/organization.type";

const WorkingHourSchema = new Schema({
  day: {
    type: String,
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    required: true,
  },
  openingTime: { type: String, required: true },
  closingTime: { type: String, required: true },
  isWorking: { type: Boolean, default: true },
});

const DepartmentSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
});

const TimeSlotSchema = new Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
});

const organizationMongoSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },

    organizationName: { type: String, required: true },
    organizationType: {
      type: String,
      enum: [
        "hospital",
        "clinic",
        "government_office",
        "service_center",
        "bank",
        "school",
        "college",
        "university",
      ],
      required: true,
    },
    description: { type: String },

    location: { type: String, required: true },
    city: { type: String },
    state: { type: String },

    // Contact
    contactEmail: { type: String },
    contactPhone: { type: String },

    // Working Schedule
    workingHours: {
      type: [WorkingHourSchema],
      default: [
        {
          day: "sunday",
          openingTime: "09:00",
          closingTime: "17:00",
          isWorking: true,
        },
        {
          day: "monday",
          openingTime: "09:00",
          closingTime: "17:00",
          isWorking: true,
        },
        {
          day: "tuesday",
          openingTime: "09:00",
          closingTime: "17:00",
          isWorking: true,
        },
        {
          day: "wednesday",
          openingTime: "09:00",
          closingTime: "17:00",
          isWorking: true,
        },
        {
          day: "thursday",
          openingTime: "09:00",
          closingTime: "17:00",
          isWorking: true,
        },
        {
          day: "friday",
          openingTime: "09:00",
          closingTime: "17:00",
          isWorking: true,
        },
        {
          day: "saturday",
          openingTime: "00:00",
          closingTime: "00:00",
          isWorking: false,
        },
      ],
    },

    // Departments
    departments: { type: [DepartmentSchema], default: [] },

    // Appointment Settings
    appointmentDuration: { type: Number, default: 30 }, // in minutes
    advanceBookingDays: { type: Number, default: 7 },

    // Time Slots
    timeSlots: {
      type: [TimeSlotSchema],
      default: [
        { startTime: "09:00", endTime: "09:30", isAvailable: true },
        { startTime: "09:30", endTime: "10:00", isAvailable: true },
        { startTime: "10:00", endTime: "10:30", isAvailable: true },
        { startTime: "10:30", endTime: "11:00", isAvailable: true },
        { startTime: "11:00", endTime: "11:30", isAvailable: true },
        { startTime: "11:30", endTime: "12:00", isAvailable: true },
        { startTime: "13:00", endTime: "13:30", isAvailable: true },
        { startTime: "13:30", endTime: "14:00", isAvailable: true },
        { startTime: "14:00", endTime: "14:30", isAvailable: true },
        { startTime: "14:30", endTime: "15:00", isAvailable: true },
        { startTime: "15:00", endTime: "15:30", isAvailable: true },
        { startTime: "15:30", endTime: "16:00", isAvailable: true },
        { startTime: "16:00", endTime: "16:30", isAvailable: true },
        { startTime: "16:30", endTime: "17:00", isAvailable: true },
      ],
    },

    // Status fields
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // Additional images
    bannerImage: { type: String }, // Store filename only
    gallery: [{ type: String }], // Array of image filenames
  },
  {
    timestamps: true, // auto-generate createdAt and updatedAt
  },
);

// Create indexes for better query performance
organizationMongoSchema.index({ userId: 1 });
organizationMongoSchema.index({ organizationType: 1 });
organizationMongoSchema.index({ city: 1, state: 1 });
organizationMongoSchema.index({ isVerified: 1, isActive: 1 });
organizationMongoSchema.index({
  organizationName: "text",
  description: "text",
});

// Interface extending both Organization type and Mongoose Document
export interface IOrganization extends Omit<Organization, "userId">, Document {
  userId: mongoose.Types.ObjectId; // reference to User
  _id: mongoose.Types.ObjectId; // MongoDB _id
  isActive: boolean;
  isVerified: boolean;
  bannerImage?: string;
  gallery?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const OrganizationModel = mongoose.model<IOrganization>(
  "Organization",
  organizationMongoSchema,
);
