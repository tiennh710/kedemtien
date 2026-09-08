declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    APP_ORIGIN?: string;
    PAYOS_CLIENT_ID?: string;
    PAYOS_API_KEY?: string;
    PAYOS_CHECKSUM_KEY?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    SESSION_SECRET?: string;
    OTP_HMAC_SECRET?: string;
    ADMIN_EMAILS?: string;
    ALLOW_DEV_OTP?: string;
  }
}
