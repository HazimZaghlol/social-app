import { Model } from "mongoose";
import { IBlackListedToken } from "../../Common";
import { BaseRepository } from "./base.repository";

export class BlackListedRepository extends BaseRepository<IBlackListedToken> {
  constructor(protected _blackListedTokenModel: Model<IBlackListedToken>) {
    super(_blackListedTokenModel);
  }
}
