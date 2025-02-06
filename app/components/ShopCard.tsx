import Image from "next/image";
import Link from "next/link";
import { Coffee, Gem, MapPin } from "lucide-react";
import useLocation from "@/hooks/useLocation";

type Module = {
  moduleId: number;
  name: string;
  colour: string;
};

interface ShopCardProps {
  shopId: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  modules: Module[];
}

const ShopCard = ({
  shopId,
  partnerId,
  name,
  pictureUrl,
  distance,
  location,
  modules: modules,
}: ShopCardProps) => {
  console.log(modules, distance, partnerId);

  const { location: userLocation } = useLocation();

  return (
    <div className="bg-background rounded-lg shadow-md overflow-hidden relative">
      <Link href={`/shop/${shopId}`} className="block">
        <Image
          src={pictureUrl}
          alt={name}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">
            {name} ({userLocation?.latitude}, {userLocation?.longitude})
          </h3>
          <p className="text-sm mb-2">
            <strong>Hours:</strong> 10:00 AM - 6:00 PM
          </p>
          <div className="flex items-center text-sm">
            <MapPin size={16} className="mr-1" />
            <p>
              {distance > 1
                ? `${distance.toFixed(1)} km from you`
                : `${(distance * 100).toFixed(1)}m from you`}
            </p>
          </div>
        </div>
        <div
          className={`absolute top-2 right-2 bg-white/80 text-primary w-16 h-6 rounded-full flex items-center justify-center gap-2`}
        >
          <Coffee size={16} />
          <Gem size={16} />
        </div>
      </Link>
      <div className="px-4 pb-4">
        <a
          href={`https://www.yandex.uz/maps?ll=${location.lng},${location.lat}&z=18`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 bg-primary text-background px-3 py-1 rounded text-sm font-medium"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
};

export default ShopCard;
