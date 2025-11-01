export interface IMetaResponse {
  statusCode: number;
  success: boolean;
}
export interface IDataResponse {
  message: string;
  data?: unknown;
}
export interface IErrorResponse {
  message: string;
  context?: object;
}

export interface ISuccessResponse {
  meta: IMetaResponse;
  data?: IDataResponse;
}

export interface IFailedResponse {
  meta: IMetaResponse;
  error?: IErrorResponse;
}
