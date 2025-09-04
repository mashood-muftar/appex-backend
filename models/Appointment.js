import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { 
    type: Date, 
    required: true,
    get: (val) => {
      if (!val) return val;
      // Format as YYYY-MM-DD
      return val.toISOString().split("T")[0];
    }
  },
  time: { type: String, required: true }, // e.g. "10:30 AM"
  location: { type: String },
  status: { type: String, enum: ["scheduled", "completed", "canceled"], default: "scheduled" },
}, { 
  timestamps: true,
  toJSON: { getters: true },   // enable getters when sending response as JSON
  toObject: { getters: true }  // enable getters when converting to object
});

export default mongoose.model("Appointment", appointmentSchema);
