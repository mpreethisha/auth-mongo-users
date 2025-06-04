import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  jobrole: { type: String, required: true },
  location: { type: String, required: true },
  education: { type: String, required: true },
  imageUrl: { type: String } // optional field for profile picture
});

const User = mongoose.model("User", userSchema);

export default User;
