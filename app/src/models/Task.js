import mongoose from 'mongoose';

const TASK_STATUSES = ['To Do', 'In Progress', 'Review', 'Complete'];

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: { values: TASK_STATUSES, message: 'Invalid status value' },
      default: 'To Do',
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, completedAt: -1 });

// ─── Hooks ──────────────────────────────────────────────────────────────────
taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Complete' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.isModified('status') && this.status !== 'Complete') {
    this.completedAt = null;
  }
  next();
});

taskSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update?.status === 'Complete') {
    this.set({ completedAt: new Date() });
  } else if (update?.status && update.status !== 'Complete') {
    this.set({ completedAt: null });
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
export { TASK_STATUSES };
export default Task;
