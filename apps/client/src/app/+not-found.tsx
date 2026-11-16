import { Link } from 'expo-router'
import { Button, PageHeading } from '@/ui/primitives'

export default function NotFoundPage() {
  return (
    <PageHeading title="Không tìm thấy trang" description="Đường dẫn này chưa có trong Sổ Tiền.">
      <Link href="/" asChild><Button label="Về tổng quan" variant="primary" /></Link>
    </PageHeading>
  )
}
