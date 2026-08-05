import React from 'react';
import {
  Wallet,
  Utensils,
  Coffee,
  Car,
  Bus,
  Fuel,
  ShoppingBag,
  ShoppingCart,
  Home,
  Lightbulb,
  Smartphone,
  Receipt,
  Heart,
  Stethoscope,
  GraduationCap,
  BookOpen,
  Plane,
  Gift,
  Gamepad2,
  Tv,
  Dumbbell,
  TrendingUp,
  Briefcase,
  PiggyBank,
  CreditCard,
  Coins,
  Banknote,
  Baby,
  Sparkles,
  Wrench,
  Shield,
  Music,
  Dog,
  Tag,
  type LucideIcon
} from 'lucide-react';

export interface CategoryIconOption {
  id: string;
  name: string;
  Icon: LucideIcon;
}

export interface CategoryColorOption {
  id: string;
  name: string;
  value: string;
  type: 'solid' | 'gradient';
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  { id: 'wallet', name: 'កាបូបប្រាក់', Icon: Wallet },
  { id: 'utensils', name: 'អាហារ', Icon: Utensils },
  { id: 'coffee', name: 'កាហ្វេ/ភេសជ្ជៈ', Icon: Coffee },
  { id: 'car', name: 'យានយន្ត', Icon: Car },
  { id: 'bus', name: 'ឡានក្រុង/ដឹកជញ្ជូន', Icon: Bus },
  { id: 'fuel', name: 'សាំង/ប្រេង', Icon: Fuel },
  { id: 'bag-shopping', name: 'ទិញទំនិញ', Icon: ShoppingBag },
  { id: 'shopping-cart', name: 'ផ្សារទំនើប', Icon: ShoppingCart },
  { id: 'home', name: 'ផ្ទះ/បន្ទប់', Icon: Home },
  { id: 'lightbulb', name: 'ទឹកភ្លើង/ថ្លៃសេវា', Icon: Lightbulb },
  { id: 'phone', name: 'ទូរស័ព្ទ/អ៊ីនធឺណិត', Icon: Smartphone },
  { id: 'receipt', name: 'វិក្កយបត្រ', Icon: Receipt },
  { id: 'heart', name: 'សុខភាព', Icon: Heart },
  { id: 'stethoscope', name: 'ពេទ្យ/ព្យាបាល', Icon: Stethoscope },
  { id: 'graduation-cap', name: 'ការសិក្សា', Icon: GraduationCap },
  { id: 'book-open', name: 'សៀវភៅ/ចំណេះដឹង', Icon: BookOpen },
  { id: 'plane', name: 'ទេសចរណ៍', Icon: Plane },
  { id: 'gift', name: 'កាដូ/ជប់លៀង', Icon: Gift },
  { id: 'gamepad-2', name: 'កម្សាន្ត/ហ្គេម', Icon: Gamepad2 },
  { id: 'tv', name: 'ទូរទស្សន៍/ភាពយន្ត', Icon: Tv },
  { id: 'dumbbell', name: 'កីឡា/ហាត់ប្រាណ', Icon: Dumbbell },
  { id: 'chart-line', name: 'ចំណេញ/វិនិយោគ', Icon: TrendingUp },
  { id: 'briefcase', name: 'ការងារ/អាជីវកម្ម', Icon: Briefcase },
  { id: 'piggy-bank', name: 'សន្សំប្រាក់', Icon: PiggyBank },
  { id: 'credit-card', name: 'កាតធនាគារ', Icon: CreditCard },
  { id: 'coins', name: 'លុយកាក់', Icon: Coins },
  { id: 'banknote', name: 'ក្រដាសប្រាក់', Icon: Banknote },
  { id: 'baby', name: 'កូនក្មេង/ទារក', Icon: Baby },
  { id: 'sparkles', name: 'សម្ផស្ស/ថែខ្លួន', Icon: Sparkles },
  { id: 'wrench', name: 'ជួសជុល/ថែទាំ', Icon: Wrench },
  { id: 'shield', name: 'ធានារ៉ាប់រង', Icon: Shield },
  { id: 'music', name: 'តន្ត្រី/សិល្បៈ', Icon: Music },
  { id: 'dog', name: 'សត្វចិញ្ចឹម', Icon: Dog },
  { id: 'tag', name: 'ផ្សេងៗ', Icon: Tag },
];

export const SOLID_COLORS: CategoryColorOption[] = [
  { id: 'mint', name: 'បៃតងម្ទេសស្រាល', value: '#34d399', type: 'solid' },
  { id: 'light-green', name: 'បៃតងខ្ចីស្រទន់', value: '#86efac', type: 'solid' },
  { id: 'emerald', name: 'ត្បូងមរកត', value: '#10b981', type: 'solid' },
  { id: 'sage', name: 'បៃតងស្លឹកឈើស្រាល', value: '#6ee7b7', type: 'solid' },
  { id: 'teal-soft', name: 'ទឹកប៊ិចបៃតងស្រាល', value: '#2dd4bf', type: 'solid' },
  { id: 'aqua', name: 'ទឹកសមុទ្រស្រាល', value: '#5eead4', type: 'solid' },
  { id: 'teal-deep', name: 'ទឹកសមុទ្រ', value: '#14b8a6', type: 'solid' },
  { id: 'sky-soft', name: 'ផ្ទៃមេឃស្រាល', value: '#38bdf8', type: 'solid' },
  { id: 'baby-blue', name: 'ខៀវស្រទន់', value: '#7dd3fc', type: 'solid' },
  { id: 'ocean-blue', name: 'ខៀវទឹកសមុទ្រ', value: '#0ea5e9', type: 'solid' },
  { id: 'classic-blue', name: 'ខៀវបុរាណ', value: '#3b82f6', type: 'solid' },
  { id: 'indigo-soft', name: 'ខៀវស្វាយស្រាល', value: '#818cf8', type: 'solid' },
  { id: 'lavender-light', name: 'ឡាវែនឌ័រស្រទន់', value: '#a5b4fc', type: 'solid' },
  { id: 'violet-soft', name: 'ស្វាយស្រាល', value: '#a78bfa', type: 'solid' },
  { id: 'violet-light', name: 'ស្វាយខ្ចី', value: '#c4b5fd', type: 'solid' },
  { id: 'lavender-deep', name: 'ស្វាយផ្កាឡាវែនឌ័រ', value: '#8b5cf6', type: 'solid' },
  { id: 'orchid', name: 'ស្វាយផ្កាអ័រគីដេ', value: '#c084fc', type: 'solid' },
  { id: 'fuchsia-soft', name: 'ស្វាយផ្កាឈូកស្រាល', value: '#e879f9', type: 'solid' },
  { id: 'sweet-pink', name: 'ផ្កាឈូកស្រទន់', value: '#f472b6', type: 'solid' },
  { id: 'baby-pink', name: 'ផ្កាឈូកខ្ចី', value: '#f9a8d4', type: 'solid' },
  { id: 'rose-soft', name: 'កុលាបស្រាល', value: '#fb7185', type: 'solid' },
  { id: 'blush-light', name: 'កុលាបស្រទន់', value: '#fda4af', type: 'solid' },
  { id: 'pastel-red', name: 'ក្រហមស្រាល', value: '#f87171', type: 'solid' },
  { id: 'coral-soft', name: 'ផ្កាថ្មស្រទន់', value: '#fb923c', type: 'solid' },
  { id: 'peach-light', name: 'ផ្លែប៉េសស្រាល', value: '#fdba74', type: 'solid' },
  { id: 'amber-soft', name: 'ទឹកក្រូចស្រាល', value: '#f59e0b', type: 'solid' },
  { id: 'honey-warm', name: 'ទឹកឃ្មុំស្រទន់', value: '#fbbf24', type: 'solid' },
  { id: 'yellow-soft', name: 'លឿងស្រទន់', value: '#fde047', type: 'solid' },
  { id: 'lime-soft', name: 'បៃតងក្រូចឆ្មា', value: '#a3e635', type: 'solid' },
  { id: 'olive-light', name: 'បៃតងអូលីវស្រាល', value: '#bef264', type: 'solid' },
  { id: 'slate-calm', name: 'ប្រផេះស្រទន់', value: '#94a3b8', type: 'solid' },
  { id: 'stone-warm', name: 'ថ្មធម្មជាតិ', value: '#a8a29e', type: 'solid' },
];

export const GRADIENT_COLORS: CategoryColorOption[] = [
  { id: 'g-emerald', name: 'បៃតងស្រទន់ (Mint Emerald)', value: 'from-emerald-400 to-teal-500', type: 'gradient' },
  { id: 'g-sky', name: 'ផ្ទៃមេឃស្រាល (Soft Sky)', value: 'from-sky-400 to-blue-500', type: 'gradient' },
  { id: 'g-indigo', name: 'ខៀវស្វាយស្រាល (Soft Indigo)', value: 'from-indigo-300 to-indigo-500', type: 'gradient' },
  { id: 'g-lavender', name: 'ផ្កាឡាវែនឌ័រ (Soft Lavender)', value: 'from-purple-300 to-indigo-400', type: 'gradient' },
  { id: 'g-pink', name: 'ផ្កាឈូកស្រាល (Sweet Pink)', value: 'from-pink-300 to-rose-400', type: 'gradient' },
  { id: 'g-rose', name: 'កុលាបស្រទន់ (Gentle Rose)', value: 'from-rose-400 to-pink-500', type: 'gradient' },
  { id: 'g-peach', name: 'ផ្លែប៉េសស្រទន់ (Soft Peach)', value: 'from-rose-300 to-amber-300', type: 'gradient' },
  { id: 'g-amber', name: 'ទឹកក្រូចស្រទន់ (Warm Amber)', value: 'from-amber-300 to-orange-400', type: 'gradient' },
  { id: 'g-lime', name: 'បៃតងខ្ចី (Spring Lime)', value: 'from-lime-300 to-emerald-400', type: 'gradient' },
  { id: 'g-teal', name: 'ទឹកសមុទ្រស្រទន់ (Soft Teal)', value: 'from-teal-300 to-cyan-500', type: 'gradient' },
  { id: 'g-cyan', name: 'ផ្ទៃមេឃត្រជាក់ (Ice Cyan)', value: 'from-cyan-300 to-sky-400', type: 'gradient' },
  { id: 'g-apricot', name: 'ផ្លែអាប់ព្រីកូត (Soft Apricot)', value: 'from-orange-300 to-amber-400', type: 'gradient' },
  { id: 'g-yellow', name: 'លឿងទន់ (Golden Glow)', value: 'from-yellow-300 to-amber-400', type: 'gradient' },
  { id: 'g-violet', name: 'ស្វាយខ្ចី (Pastel Violet)', value: 'from-violet-400 to-purple-500', type: 'gradient' },
  { id: 'g-raspberry', name: 'ក្រហមស្រទន់ (Soft Raspberry)', value: 'from-fuchsia-300 to-rose-400', type: 'gradient' },
  { id: 'g-slate', name: 'ប្រផេះស្រទន់ (Calm Slate)', value: 'from-slate-400 to-slate-600', type: 'gradient' },
];

export const ALL_CATEGORY_COLORS: CategoryColorOption[] = [
  ...SOLID_COLORS,
  ...GRADIENT_COLORS
];

// Backwards compatibility
export const CATEGORY_COLORS = ALL_CATEGORY_COLORS;

export const getCategoryIconComponent = (iconId?: string, className: string = "w-4 h-4 text-white"): React.ReactElement => {
  const match = CATEGORY_ICONS.find(item => item.id === iconId);
  if (match) {
    const IconComponent = match.Icon;
    return <IconComponent className={className} />;
  }
  // Fallbacks for legacy/alternative IDs
  switch (iconId) {
    case 'shopping-bag':
    case 'bag-shopping':
      return <ShoppingBag className={className} />;
    case 'trending-up':
    case 'chart-line':
      return <TrendingUp className={className} />;
    case 'phone':
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'gamepad':
    case 'gamepad-2':
      return <Gamepad2 className={className} />;
    case 'paw-print':
    case 'dog':
      return <Dog className={className} />;
    case 'education':
    case 'graduation-cap':
      return <GraduationCap className={className} />;
    case 'book':
    case 'book-open':
      return <BookOpen className={className} />;
    default:
      return <Tag className={className} />;
  }
};

export const CategoryIcon: React.FC<{ iconName?: string; className?: string }> = ({ iconName, className = "w-4 h-4 text-white" }) => {
  return getCategoryIconComponent(iconName, className);
};

export interface CategoryBadgeProps {
  color?: string;
  icon?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  color,
  icon,
  size = 'sm',
  className = '',
  iconClassName
}) => {
  const isGradient = color?.includes('from-');
  const isHexOrRgb = color?.startsWith('#') || color?.startsWith('rgb');

  let sizeClass = 'w-6 h-6 rounded-md';
  let defaultIconSize = 'w-3.5 h-3.5 text-white';

  if (size === 'xs') {
    sizeClass = 'w-5 h-5 rounded-md';
    defaultIconSize = 'w-3 h-3 text-white';
  } else if (size === 'md') {
    sizeClass = 'w-8 h-8 rounded-lg';
    defaultIconSize = 'w-4 h-4 text-white';
  } else if (size === 'lg') {
    sizeClass = 'w-11 h-11 rounded-lg';
    defaultIconSize = 'w-5 h-5 text-white';
  }

  const bgStyle = isHexOrRgb ? { backgroundColor: color } : {};
  const bgClass = isGradient
    ? `bg-gradient-to-br ${color}`
    : (!isHexOrRgb && color?.startsWith('bg-'))
    ? color
    : (!isHexOrRgb && !isGradient)
    ? 'bg-slate-400'
    : '';

  return (
    <div
      className={`${sizeClass} ${bgClass} flex items-center justify-center shadow-xs flex-shrink-0 ${className}`}
      style={bgStyle}
    >
      <CategoryIcon iconName={icon} className={iconClassName || defaultIconSize} />
    </div>
  );
};
