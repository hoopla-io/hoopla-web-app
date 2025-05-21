'use client';

import { ArrowLeft, MapPin, Clock, Phone, Globe, Instagram } from 'lucide-react';
import { use, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import ShareButton from '@/components/base/share-button';

import { useFormatHours } from '@/app/shops/hooks/useFormatHours';
import { useShop } from '@/app/shops/hooks/useShop';
import useLocation from '@/hooks/useLocation';

export default function Page({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { location } = useLocation();

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const { formatWorkingHours } = useFormatHours();

  const { shopDetail, isLoading, isError } = useShop({
    shopId: Number(shopId),
  });

  if (isError) return <div>Error: {isError}</div>;

  if (isLoading || !shopDetail) return <div>Loading...</div>;

  return (
    <div className="bg-subtle-bg pb-20">
      <div className="relative h-[24vh]">
        <Image
          src={shopDetail.pictures[currentImageIndex]?.pictureUrl || '/placeholder.svg'}
          alt={shopDetail.name!}
          fill
          className="object-cover"
        />

        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm">
          {currentImageIndex + 1}/{shopDetail.pictures.length}
        </div>
      </div>

      {/* Image Thumbnails */}
      <div className="px-4 -mt-6 mb-6 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {shopDetail.pictures.map((picture, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 relative h-16 w-24 ${
                currentImageIndex === index ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image
                src={picture.pictureUrl || '/placeholder.svg'}
                alt={`${shopDetail.name} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">{shopDetail.name}</h1>

          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <p className="text-sm">Open today: {formatWorkingHours(shopDetail.workingHours)}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              <a
                href={`https://yandex.uz/maps/?ll=${shopDetail.location?.lng},${shopDetail.location?.lat}&z=16&mode=routes&rtext=${location?.latitude},${location?.longitude}~${shopDetail.location?.lat},${shopDetail.location?.lng}&ruri=~&rtt=auto`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                Get Directions
              </a>
            </div>
            {shopDetail.phoneNumbers.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <Phone size={20} className="text-primary" />
                <a href={`tel:${phone.phoneNumber}`} className="text-sm">
                  {phone.phoneNumber}
                </a>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mt-4">
            {shopDetail.urls.map((url, index) => (
              <a
                key={index}
                href={url.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:opacity-80"
              >
                {url.urlType === 'web' ? <Globe size={24} /> : <Instagram size={24} />}
              </a>
            ))}
          </div>
        </div>

        {/* Available Drinks */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Drinks</h2>
          <div className="grid grid-cols-2 gap-4">
            {shopDetail.drinks?.map(drink => (
              <div key={drink.id} className="bg-background rounded-lg overflow-hidden shadow-md">
                <Image
                  src={drink.pictureUrl || '/placeholder.svg'}
                  alt={drink.name}
                  width={200}
                  height={200}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  <h3 className="font-medium text-center">{drink.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
