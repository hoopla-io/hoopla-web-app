import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Shop } from "@/api/domains/shops";
import { AspectRatio } from "@/components/ui/aspect-ratio";

function formatDistance(distance: number): string {
  if (distance >= 1) return `${distance.toFixed(1)} km`;
  return `${(distance * 1000).toFixed(0)} m`;
}

interface ShopCardProps {
  shop: Shop;
}

const ShopCard = ({ shop }: ShopCardProps) => {
  return (
    <Link to={`/shops/${shop.shopId}`} className="block">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
        <AspectRatio ratio={480 / 320}>
          <img
            src={shop.pictureUrl}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
        <div className="flex items-center gap-3 p-3">
          <Link
            to={`/partners/${shop.partnerId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          >
            <img
              src={shop.pictureUrl}
              alt={shop.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
            />
          </Link>
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate">{shop.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
              <MapPin size={14} />
              <span>{formatDistance(shop.distance)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;
export { formatDistance };
