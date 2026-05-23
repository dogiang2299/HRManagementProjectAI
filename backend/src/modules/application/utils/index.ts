import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

// cấu hình file - giới hạn dung lượng file - chỉ cho phép PDF, DOC, DOCX và lưu file ở uploads
export const applyCvInterceptor = FileInterceptor('cv', {
  limits: { fileSize: 5 * 1024 * 1024 }, // lớn hơn 5MB thì sẽ bị reject.
  fileFilter: (req, file, cb) => {
    const ok = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.mimetype);

    cb(ok ? null : new Error('Invalid file type'), ok);
  },
  storage: diskStorage({
    destination: './uploads/cv',
    filename: (req, file, cb) => {
      const safe = sanitizeFilename(file.originalname); // Đặt lại tên file cho an toàn
      const ext = safe.includes('.') ? safe.split('.').pop() : '';
      const base = ext ? safe.slice(0, -(ext.length + 1)) : safe;
      const filename = `${Date.now()}-${base}.${ext || 'file'}`;
      cb(null, filename);
    },
  }),
});

