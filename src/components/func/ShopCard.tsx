import { MapPin, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Shop } from "@/api/domains/shops";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ShopStatusBadge } from "@/components/func/ShopStatusBadge";

function formatDistance(distance: number): string {
  if (distance >= 1) return `${distance.toFixed(1)} km`;
  return `${(distance * 1000).toFixed(0)} m`;
}

interface ShopCardProps {
  shop: Shop;
}

const ShopCard = ({ shop }: ShopCardProps) => {
  const navigate = useNavigate();

  return (
    <Link to={`/shops/${shop.shopId}`} className="block">
      <article className="group relative overflow-hidden rounded-[28px] bg-white ring-1 ring-black/[0.04] shadow-[0_12px_30px_-16px_rgba(141,11,65,0.4)] transition-transform duration-300 active:scale-[0.98]">
        {/* Photo */}
        <div className="relative">
          <AspectRatio ratio={3 / 2}>
            <img
              src={shop.pictureUrl}
              alt={shop.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-active:scale-[1.04]"
            />
          </AspectRatio>

          {/* Scrim for legibility of the overlaid chips */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

          {/* Distance chip */}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm ring-1 ring-white/60 backdrop-blur-md">
            <MapPin size={12} className="text-[var(--color-primary)]" />
            {formatDistance(shop.distance)}
          </span>

          {/* Open / Closed status */}
          <ShopStatusBadge
            acceptingOrders={shop.acceptingOrders}
            pausedUntil={shop.pausedUntil}
            className="absolute right-3 top-3"
          />
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-6">
          <div className="flex items-end gap-3">
            {/* Partner avatar, lifted to overlap the photo edge.
                A button (not a Link) to avoid nesting <a> inside the card <a>. */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/partners/${shop.partnerId}`);
              }}
              className="-mt-10 shrink-0"
            >
              <img
                src={shop.pictureUrl}
                alt={shop.name}
                className="h-14 w-14 rounded-2xl object-cover shadow-md ring-4 ring-white"
              />
            </button>

            <div className="min-w-0 flex-1 pb-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]/70">
                Cafe
              </p>
              <h3 className="truncate text-[17px] font-semibold leading-snug tracking-tight text-gray-900">
                {shop.name}
              </h3>
            </div>

            {/* Order CTA */}
            <div className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_6px_16px_-4px_rgba(141,11,65,0.65)] transition-transform duration-300 group-active:scale-90">
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ShopCard;
export { formatDistance };
