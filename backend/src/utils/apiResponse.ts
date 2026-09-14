export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;

  constructor(message: string, data: T, success: boolean = true) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}
