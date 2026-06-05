import { Star } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
}

function getReviewStats(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const base = Math.abs(hash);
  const total = 50 + (base % 80);
  return {
    total,
    rating: 4.8,
    distribution: [
      Math.round(total * 0.78),
      Math.round(total * 0.15),
      Math.round(total * 0.05),
      Math.round(total * 0.01),
      Math.round(total * 0.01),
    ],
  };
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const stats = getReviewStats(productId);
  const percentages = stats.distribution.map(d => Math.round((d / stats.total) * 100));

  return (
    <div className="border-t pt-4 mt-4">
      <h2 className="font-semibold mb-4">Valoraciones de Clientes</h2>
      <div className="flex items-start gap-6">
        <div className="text-center shrink-0">
          <p className="text-4xl font-bold">{stats.rating.toString().replace('.', ',')}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className="h-3.5 w-3.5 fill-warning text-warning" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.total} valoraciones</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star, i) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-3">{star}</span>
              <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full"
                  style={{ width: `${percentages[i]}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{percentages[i]}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
