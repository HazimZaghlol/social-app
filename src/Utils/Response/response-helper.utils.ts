import { IFailedResponse, ISuccessResponse } from "../../Common";

export function SuccessResponse<T>(message: string, data?: T, statusCode: number = 200): ISuccessResponse {
  return {
    meta: {
      statusCode,
      success: true,
    },
    data: {
      message,
      data,
    },
  };
}

export function FailedResponse(message: string = "your request is failed", statusCode: number = 500, error?: object): IFailedResponse {
  return {
    meta: {
      statusCode,
      success: false,
    },
    error: {
      message,
      context: error,
    },
  };
}
