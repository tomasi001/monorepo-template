export interface SuccessResponse<T> {
  statusCode: number;
  success: true;
  message: string;
  data: T;
}

export interface ErrorResponse {
  statusCode: number;
  success: false;
  message: string;
  error: string;
  data: null;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
