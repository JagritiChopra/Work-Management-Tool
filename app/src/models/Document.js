import mongoose from 'mongoose';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg'];

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null, // null = root
    },
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
      maxlength: [200, 'Document name cannot exceed 200 characters'],
    },
    originalName: { type: String },
    mimeType: {
      type: String,
      enum: { values: ALLOWED_TYPES, message: 'Only PDF and JPG files are allowed' },
      required: true,
    },
    size: { type: Number }, // bytes
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    tags: [{ type: String, trim: true, maxlength: 30 }],
  },
  { timestamps: true }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
documentSchema.index({ user: 1, folder: 1 });
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, tags: 1 });

const Document = mongoose.model('Document', documentSchema);
export { ALLOWED_TYPES };
export default Document;
