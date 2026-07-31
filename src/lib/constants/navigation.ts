import {
  Building2,
  Home,
  PlusCircle,
  Presentation,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const mainNavItems: NavItem[] = [
  { label: "Ana Sayfa", href: "/", icon: Home },
  { label: "İlanlar", href: "#", icon: Building2 },
  { label: "Yeni İlan", href: "#", icon: PlusCircle },
  { label: "Sunumlar", href: "#", icon: Presentation },
  { label: "Ayarlar", href: "#", icon: Settings },
];
