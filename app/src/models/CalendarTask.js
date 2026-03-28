import mongoose from 'mongoose';

const calendarTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    color: {
      type: String,
      default: '#4F46E5',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color hex code'],
    },
    isCompleted: { type: Boolean, default: false },
    allDay: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
calendarTaskSchema.index({ user: 1, date: 1 });
calendarTaskSchema.index({ user: 1, date: -1 });

const CalendarTask = mongoose.model('CalendarTask', calendarTaskSchema);
export default CalendarTask;
