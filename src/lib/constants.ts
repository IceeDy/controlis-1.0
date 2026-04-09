import {
  BarChart3,
  Boxes,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Produtos", href: "/products", icon: Package },
  { label: "Estoque", href: "/inventory", icon: Boxes },
  { label: "Vendas", href: "/sales", icon: ShoppingCart },
  { label: "Configurações", href: "/settings", icon: Settings },
] as const;

export const productCategories = [
  "Mercearia",
  "Bebidas",
  "Limpeza",
  "Padaria",
  "Higiene",
  "Congelados",
] as const;

export const movementTypeLabels = {
  entrada: "Entrada",
  ajuste: "Ajuste",
  saida: "Saída",
} as const;

export const saleStatusLabels = {
  concluida: "Concluída",
  cancelada: "Cancelada",
} as const;

export const initialAccessCredentials = {
  email: "admin@controlis.com",
  password: "admin123",
};
