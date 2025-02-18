import { MapPin } from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';

interface PartnerCardProps {
  id: number;
  name: string;
  image: string;
  workingHours: string;
  address: string;
}

const PartnerCard = ({ id, name, image, workingHours, address }: PartnerCardProps) => {
  return (
    <div className="bg-background rounded-lg shadow-md overflow-hidden">
      <Link href={`/partner/${id}`} className="block">
        <Image
          src={image}
          alt={name}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <p className="text-sm mb-2">
            <strong>Hours:</strong> {workingHours}
          </p>
          <div className="flex items-center text-sm">
            <MapPin size={16} className="mr-1" />
            <p>{address}</p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
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

export default PartnerCard;
