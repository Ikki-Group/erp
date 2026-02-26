export class ApiError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;

    // Memastikan prototype chain benar untuk custom error di TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get friendlyMessage(): string {
    switch (this.status) {
      case 400:
        return "Permintaan tidak valid.";
      case 401:
        return "Sesi telah berakhir, silakan login kembali.";
      case 403:
        return "Anda tidak memiliki izin untuk akses ini.";
      case 404:
        return "Data atau halaman tidak ditemukan.";
      case 422:
        return "Data yang Anda masukkan tidak sesuai validasi.";
      case 500:
        return "Terjadi kesalahan pada server kami.";
      default:
        return this.message || "Terjadi kesalahan yang tidak terduga.";
    }
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isClientError() {
    return (this.status || 0) >= 400 && (this.status || 0) < 500;
  }

  get isValidationError() {
    return this.status === 422;
  }
}
