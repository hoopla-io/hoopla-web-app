'use client';

import { Coffee, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import debounce from 'lodash/debounce';

import useLocation from '@/hooks/useLocation';
import { useShops } from '@/hooks/useShops';

import ShopCard from '@/components/func/ShopCard';

const LoadingScreen = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-6 space-y-6">
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
  const [searchText, setSearchText] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  const { location, error } = useLocation();

  const { shops = [] } = useShops({
    lat: Number(location?.latitude),
    lng: Number(location?.longitude),
    name: searchText,
  });

  if (error) {
    return <ErrorComponent error={error} />;
  }

  if (!location) {
    return <LoadingScreen />;
  }

  const debouncedInputChange = debounce((event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchText(value);
  }, 500);

  const debouncedClearInput = debounce(() => {
    if (searchRef.current) {
      searchRef.current.value = '';
    }
    setSearchText('');
  }, 500);

  return (
    <div className="px-4 py-6 space-y-4 flex flex-col">
      <div className="relative">
        <Input
          ref={searchRef}
          name="name"
          placeholder="Search"
          onChange={debouncedInputChange}
          className="py-6"
        />
        <X
          className="h-6 w-6 absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer hover:text-primary"
          onClick={debouncedClearInput}
        />
      </div>
      {shops.map((shop, index) => (
        <ShopCard key={index} {...shop} />
      ))}

      {shops.length === 0 && (
        <div className="py-8 flex flex-col items-center justify-center">
          <Coffee size={40} className="text-primary" />
          <p>No shops found.</p>
          <p>Try searching for a different name.</p>
        </div>
      )}
    </div>
  );
}
