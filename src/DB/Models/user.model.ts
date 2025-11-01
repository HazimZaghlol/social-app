import mongoose from "mongoose";
import { GenderEnum, IUser, OTPTypeEnum, ProviderEnum, RoleEnum } from "../../Common";
import { encryptPhone, generateHash } from "../../Utils";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstname: { type: String, required: true, minLength: [4, "first name must be at least 4 characters long"] },
    lastname: { type: String, required: true, minLength: [4, "last name must be at least 4 characters long"] },
    email: {
      type: String,
      required: true,
      index: {
        unique: true,
        name: "idx_email_unique",
      },
    },
    password: { type: String, required: true, minLength: [6, "password must be at least 6 characters long"] },
    age: { type: Number, min: [1, "age must be at least 1"], max: [120, "age must be at most 120"] },
    role: { type: String, enum: RoleEnum, default: RoleEnum.USER },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.Other },
    DOB: { type: Date },
    coverPic: { type: String },
    profilePic: { type: String },
    provider: { type: String, enum: ProviderEnum, default: ProviderEnum.Local },
    isVerified: { type: Boolean, default: false },
    phoneNumber: { type: String },
    googleId: { type: String },
    OTPs: [
      {
        value: { type: String, required: true },
        expiresAt: { type: Date },
        otpType: { type: String, enum: OTPTypeEnum.SIGNUP_OTP, required: true },
      },
    ],
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,

    methods: {
      getFullName() {
        return `${this.firstname} ${this.lastname}`;
      },
    },

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },

    virtuals: {
      fullName: {
        get: function (this: IUser): string {
          return `${this.firstname} ${this.lastname}`;
        },
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await generateHash(this.password as string);
  }
  if (this.isModified("phoneNumber")) {
    this.phoneNumber = encryptPhone(this.phoneNumber! as string);
  }
  next();
});

userSchema.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate() as Partial<IUser>;

  if (update.password) {
    update.password = await generateHash(update.password);
  }

  if (update.phoneNumber) {
    update.phoneNumber = encryptPhone(update.phoneNumber);
  }

  next();
});

export const UserModel = mongoose.model("User", userSchema);
