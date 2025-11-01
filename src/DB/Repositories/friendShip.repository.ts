import { IFriendShip } from "../../Common";
import { FriendShipModel } from "../Models/friendShip.model";
import { BaseRepository } from "./base.repository";


export class FriendShipRepository extends BaseRepository<IFriendShip> {
constructor() {
    super(FriendShipModel);
}
}