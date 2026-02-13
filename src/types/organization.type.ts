import z from "zod";

export const OrganizationTypeSchema = z.enum([
  "hospital",
  "clinic",
  "government_office",
  "service_center",
  "bank",
  "school",
  "college",
  "university",
  "others",
]);

export const DayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const WorkingHourSchema = z.object({
  day: DayOfWeekSchema,
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isWorking: z.boolean().default(true),
});

export const DepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
});

export const TimeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  isAvailable: z.boolean().default(true),
});

export const OrganizationSchema = z.object({
  organizationName: z.string().min(3, "Organization name is required"),
  organizationType: OrganizationTypeSchema,
  description: z.string().optional(),

  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),

  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),

  workingHours: z
    .array(WorkingHourSchema)
    .length(7)
    .default([
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
    ]),

  departments: z.array(DepartmentSchema).default([]),

  appointmentDuration: z.number().min(5).default(30),
  advanceBookingDays: z.number().min(1).default(7),

  // Time Slots  => Pre-defined slots for appointments
  timeSlots: z.array(TimeSlotSchema).default([
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
  ]),
});

export type Organization = z.infer<typeof OrganizationSchema>;
