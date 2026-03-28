import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'],
    },
    duration: {
      type: Number, // in minutes
      min: [1, 'Duration must be at least 1 minute'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Normalised date for grouping (YYYY-MM-DD stored as Date at midnight UTC)
    dateKey: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
sessionSchema.index({ user: 1, date: -1 });
sessionSchema.index({ user: 1, dateKey: -1 });

// ─── Hooks ──────────────────────────────────────────────────────────────────
sessionSchema.pre('save', function (next) {
  const d = new Date(this.date);
  this.dateKey = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  if (this.startTime && this.endTime) {
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) this.duration = diff;
  }
  next();
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
