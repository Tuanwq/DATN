import { AuthError } from './auth-api'

const messages: Record<AuthError['code'], string> = {
  INVALID_REQUEST: 'Kiểm tra định dạng email và mật khẩu rồi thử lại.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Máy chủ từ chối yêu cầu này.',
  RATE_LIMITED: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau một phút.',
  GOOGLE_UNAVAILABLE: 'Đăng nhập Google chưa sẵn sàng trên bản này.',
  GOOGLE_FAILED: 'Không xác thực được với Google. Vui lòng thử lại.',
  GOOGLE_NOT_LINKED: 'Tài khoản Google này chưa được liên kết với Sổ Tiền.',
  GOOGLE_CANCELLED: 'Bạn đã hủy đăng nhập bằng Google.',
  SERVER_ERROR: 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.',
  NETWORK_ERROR: 'Không kết nối được với máy chủ. Vui lòng kiểm tra mạng và thử lại.',
  API_NOT_CONFIGURED: 'Ứng dụng chưa được cấu hình để kết nối máy chủ.',
  STORAGE_ERROR: 'Không truy cập được bộ nhớ bảo mật. Vui lòng thử lại.',
}

export function describeAuthError(error: unknown) {
  return error instanceof AuthError ? messages[error.code] : messages.SERVER_ERROR
}
