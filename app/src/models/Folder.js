import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
    // Full path stored for efficient subtree queries
    path: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#6366f1',
      match: [/^#([A-Fa-f0-9]{6})$/, 'Invalid color hex'],
    },
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
folderSchema.index({ user: 1, parent: 1 });
folderSchema.index({ user: 1, path: 1 });
folderSchema.index({ user: 1, name: 1, parent: 1 }, { unique: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
