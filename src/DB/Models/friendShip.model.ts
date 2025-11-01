import mongoose from "mongoose";
import { FriedShipStatusEnum, IFriendShip } from "../../Common";

const friendShipSchema = new mongoose.Schema<IFriendShip>({
  requestFormId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestToId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: FriedShipStatusEnum,
    default: FriedShipStatusEnum.PENDING,
  },
});
export const FriendShipModel = mongoose.model("FriendShip", friendShipSchema);
