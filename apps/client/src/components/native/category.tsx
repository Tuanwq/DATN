import { Banknote, BriefcaseBusiness, CarFront, Clapperboard, HeartPulse, House, ShoppingBag, Utensils, Zap, type LucideIcon } from 'lucide-react-native'
import type { CategoryId } from '@/types/finance'
import { IconTile, type Tone } from '@/ui/primitives'

export const categories = {
  salary: { label: 'Lương', icon: Banknote, tone: 'green' },
  freelance: { label: 'Làm thêm', icon: BriefcaseBusiness, tone: 'green' },
  housing: { label: 'Nhà ở', icon: House, tone: 'green' },
  food: { label: 'Ăn uống', icon: Utensils, tone: 'amber' },
  shopping: { label: 'Mua sắm', icon: ShoppingBag, tone: 'blue' },
  transport: { label: 'Di chuyển', icon: CarFront, tone: 'green' },
  utilities: { label: 'Hóa đơn', icon: Zap, tone: 'blue' },
  health: { label: 'Sức khỏe', icon: HeartPulse, tone: 'rose' },
  leisure: { label: 'Giải trí', icon: Clapperboard, tone: 'amber' },
} satisfies Record<CategoryId, { label: string; icon: LucideIcon; tone: Tone }>

export function CategoryIcon({ id }: { id: CategoryId }) {
  const { icon, tone } = categories[id]
  return <IconTile icon={icon} tone={tone} />
}
