enum RoleEnum {
  ADMIN = "admin",
  USER = "user",
}

enum GenderEnum {
  Male = "male",
  Female = "female",
  Other = "other",
}

enum ProviderEnum {
  Local = "local",
  Google = "google",
  Facebook = "facebook",
}

enum OTPTypeEnum {
  SIGNUP_OTP = "signup-otp",
  FORGOT_PASSWORD_OTP = "forgot-password-otp",
  CHANGE_EMAIL_OTP = "change-email-otp",
  CONFIRM_EMAIL_OTP = "confirm-email-otp",
}

enum FriedShipStatusEnum {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  BLOCKED = "blocked",
}

export { RoleEnum, GenderEnum, ProviderEnum, OTPTypeEnum, FriedShipStatusEnum };
