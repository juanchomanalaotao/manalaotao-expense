import type { ExpenseCategory } from './types'

export const CATEGORIES: {
  id: ExpenseCategory
  label: string
  emoji: string
  tip: string
}[] = [
  {
    id: 'pagkain',
    label: 'Groceries / Palengke',
    emoji: '🛒',
    tip: 'Maglista bago bumili at iwasan ang gutom kapag mamimili.',
  },
  {
    id: 'ulam',
    label: 'Kain labas / Delivery',
    emoji: '🍜',
    tip: 'Limitahan ang delivery — mas mura ang luto sa bahay.',
  },
  {
    id: 'transport',
    label: 'Transportasyon',
    emoji: '🚌',
    tip: 'Isama ang pamasahe sa weekly plan para hindi maubos bigla.',
  },
  {
    id: 'bills',
    label: 'Bills (kung hindi fixed)',
    emoji: '💡',
    tip: 'I-off ang appliances na hindi ginagamit para bumaba ang kuryente.',
  },
  {
    id: 'health',
    label: 'Gamot / Kalusugan',
    emoji: '💊',
    tip: 'Magtabi ng maliit na health fund bawat buwan.',
  },
  {
    id: 'kids',
    label: 'Anak / Eskwela',
    emoji: '📚',
    tip: 'Unahin ang needs bago wants para sa mga bata.',
  },
  {
    id: 'home',
    label: 'Bahay / Maintenance',
    emoji: '🏠',
    tip: 'Ayusin agad ang maliliit na sira bago lumala.',
  },
  {
    id: 'libangan',
    label: 'Libangan',
    emoji: '🎬',
    tip: 'Mag-set ng limit — libangan lang pag may natira sa budget.',
  },
  {
    id: 'iba',
    label: 'Iba pa',
    emoji: '📦',
    tip: 'Isulat ang dahilan para makita kung paulit-ulit ang gastos.',
  },
]

export function categoryMeta(id: ExpenseCategory) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
