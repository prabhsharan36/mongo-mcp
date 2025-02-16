// src/models/User.model.ts
import mongoose, { Document, Schema } from "mongoose";
import { MCPModel } from "./model";

interface IUser extends Document {
  name: string;
  email: string;
  age: number;
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: String,
  age: Number,
});

const UserMongooseModel = mongoose.model<IUser>("User", UserSchema);

export class UserModel extends MCPModel<IUser> {
  constructor() {
    super(UserMongooseModel);
  }

  async findByEmail(email: string) {
    return this.model.findOne({ email });
  }
}
