export type ProductStatus = 'draft' | 'published' | 'archived';

export type CatalogProduct = {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  categorySlug: string;
  priceVnd: number;
  licenseNote: string;
  status: ProductStatus;
  coverTone: string;
  coverUrl: string | null;
  galleryUrls: string[];
  assetId: number | null;
  version: number | null;
  filename: string | null;
  sizeBytes: number | null;
  demo?: boolean;
};

export const demoProducts: CatalogProduct[] = [
  ['quan-ly-thu-chi-ca-nhan-2026', 'Quản lý thu chi cá nhân 2026', 'Theo dõi ngân sách, dòng tiền và mục tiêu tiết kiệm trên một dashboard trực quan.', 'Tài chính cá nhân', 'tai-chinh-ca-nhan', 149000, 'indigo'],
  ['dashboard-dong-tien-doanh-nghiep', 'Dashboard dòng tiền doanh nghiệp', 'Báo cáo thu, chi và số dư theo tháng dành cho doanh nghiệp nhỏ.', 'Kinh doanh', 'kinh-doanh', 299000, 'mint'],
  ['theo-doi-cong-viec-theo-tuan', 'Theo dõi công việc theo tuần', 'Lập kế hoạch tuần, ưu tiên công việc và nhìn nhanh tiến độ.', 'Quản lý dự án', 'quan-ly-du-an', 0, 'amber'],
  ['bao-cao-ban-hang-da-kenh', 'Báo cáo bán hàng đa kênh', 'Tổng hợp doanh thu, chi phí và hiệu quả theo từng kênh bán.', 'Báo cáo & KPI', 'bao-cao-kpi', 219000, 'rose'],
  ['bang-tinh-lai-lo-kinh-doanh', 'Bảng tính lãi lỗ kinh doanh', 'Nắm rõ biên lợi nhuận, chi phí cố định và điểm hòa vốn.', 'Kế toán', 'ke-toan', 179000, 'sky'],
  ['ke-hoach-tai-chinh-12-thang', 'Kế hoạch tài chính 12 tháng', 'Lập kế hoạch dòng tiền và so sánh thực tế với mục tiêu cả năm.', 'Tài chính cá nhân', 'tai-chinh-ca-nhan', 249000, 'violet'],
].map((row, index) => ({
  id: -(index + 1),
  slug: row[0] as string,
  title: row[1] as string,
  shortDescription: row[2] as string,
  description: 'Đây là sản phẩm minh họa. Admin có thể đăng nhập và thay bằng sản phẩm thật để bắt đầu mở bán.',
  category: row[3] as string,
  categorySlug: row[4] as string,
  priceVnd: row[5] as number,
  licenseNote: 'Giấy phép sử dụng tiêu chuẩn',
  status: 'published' as const,
  coverTone: row[6] as string,
  coverUrl: null,
  galleryUrls: [],
  assetId: null,
  version: null,
  filename: null,
  sizeBytes: null,
  demo: true,
}));

export function formatVnd(value: number) {
  if (value === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}
