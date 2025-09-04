import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g. "10:30 AM"
  location: { type: String },
  status: { type: String, enum: ["scheduled", "completed", "canceled"], default: "scheduled" },
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
