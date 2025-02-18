'use client';

import { Coffee } from 'lucide-react';

import useLocation from '@/hooks/useLocation';
import { useShops } from '@/hooks/useShops';

import ShopCard from '@/components/func/ShopCard';

const LoadingScreen = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 space-y-6">
      {/* Animated Coffee Icon */}
      <div className="relative">
        <Coffee size={40} className="text-primary animate-bounce" />
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Discovering Coffee Shops</h3>
        <p className="text-sm text-gray-500">Finding the perfect brew near you...</p>
      </div>

      {/* Loading Bar */}
      <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-progress" />
      </div>
    </div>
  );
};

const ErrorComponent = (props: { error: string }) => {
  const { error } = props;
  return (
    <div className="p-4 text-center">
      <p className="text-red-500">{error}</p>
      <p className="mt-2">
        We can&apos;t show nearby shops without your location. Please enable location services and
        refresh the page.
      </p>
    </div>
  );
};

export default function Page() {
  const { location, error } = useLocation();

  const { shops = [], isLoading } = useShops({
    lat: Number(location?.latitude),
    lng: Number(location?.longitude),
  });

  if (error) {
    return <ErrorComponent error={error} />;
  }

  if (!location) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Near shops</h2>
      {shops.map((shop, index) => (
        <ShopCard key={index} {...shop} />
      ))}
    </div>
  );
}
