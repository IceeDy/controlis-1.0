import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { BestSeller } from "@/types/dashboard";

interface BestSellersListProps {
  items: BestSeller[];
}

export function BestSellersList({ items }: BestSellersListProps) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Produtos mais vendidos</h3>
          <p className="text-sm text-text-soft">Ranking mensal por unidades e receita.</p>
        </div>
        <div className="rounded-3xl bg-secondary-soft p-3 text-secondary">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item, index) => (
          <div key={item.productId} className="flex items-center justify-between rounded-2xl bg-surface-strong px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft font-semibold text-primary">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="text-xs text-text-soft">{item.unitsSold} unidades vendidas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{formatCurrency(item.revenue)}</p>
              <p className="text-xs text-text-soft">receita gerada</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
