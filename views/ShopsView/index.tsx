"use client";

import ShopCard from "@/app/components/ShopCard";
import useLocation from "@/hooks/useLocation";
import { Loader2 } from "lucide-react";
import { useShops } from "./hooks/useShops";

// const shops = [
//   {
//     shopId: 5,
//     partnerId: 3,
//     name: "B&B Chekov",
//     pictureUrl: "http://api.hoopla.uz/images/pictures/bnb_chekhova_1.jpg",
//     distance: 39.90172379491845,
//     location: {
//       lat: 41.2947736,
//       lng: 69.2717623,
//     },
//     modules: [
//       {
//         moduleId: 2,
//         name: "Pro",
//         colour: "#FF0000",
//       },
//     ],
//   },
//   {
//     shopId: 4,
//     partnerId: 3,
//     name: "B&B Tashkent City",
//     pictureUrl: "http://api.hoopla.uz/images/pictures/bnb_tashkent_city_1.jpg",
//     distance: 40.49864892824487,
//     location: {
//       lat: 41.313746,
//       lng: 69.245677,
//     },
//     modules: [
//       {
//         moduleId: 2,
//         name: "Pro",
//         colour: "#FF0000",
//       },
//     ],
//   },
//   {
//     shopId: 1,
//     partnerId: 1,
//     name: "Safia Tashkent City",
//     pictureUrl: "http://api.hoopla.uz/images/pictures/sofiya_3.jpg",
//     distance: 40.72759170657786,
//     location: {
//       lat: 41.3162257,
//       lng: 69.2454729,
//     },
//     modules: [
//       {
//         moduleId: 2,
//         name: "Pro",
//         colour: "#FF0000",
//       },
//     ],
//   },
//   {
//     shopId: 3,
//     partnerId: 4,
//     name: "Aroma Tashkent City Mall",
//     pictureUrl: "http://api.hoopla.uz/images/pictures/aroma_3.jpeg",
//     distance: 40.968477358581964,
//     location: {
//       lat: 41.3156125,
//       lng: 69.2524831,
//     },
//     modules: [
//       {
//         moduleId: 2,
//         name: "Pro",
//         colour: "#FF0000",
//       },
//     ],
//   },
//   {
//     shopId: 2,
//     partnerId: 1,
//     name: "Safia Parkent",
//     pictureUrl: "http://api.hoopla.uz/images/pictures/sofiya_6.jpg",
//     distance: 44.54200125473377,
//     location: {
//       lat: 41.312797,
//       lng: 69.33236,
//     },
//     modules: [
//       {
//         moduleId: 1,
//         name: "Lite",
//         colour: "#808080",
//       },
//       {
//         moduleId: 2,
//         name: "Pro",
//         colour: "#FF0000",
//       },
//     ],
//   },
// ];

const ErrorComponent = (props: { error: string }) => {
  const { error } = props;
  return (
    <div className="p-4 text-center">
      <p className="text-red-500">{error}</p>
      <p className="mt-2">
        We can&apos;t show nearby shops without your location. Please enable
        location services and refresh the page.
      </p>
    </div>
  );
};

const LoadingComponent = () => {
  return (
    <div className="p-4 flex justify-center items-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="ml-2">Getting your location...</span>
    </div>
  );
};

export default function ShopsView() {
  const { location, error } = useLocation();

  const { shops = [] } = useShops({
    lat: location?.latitude || 41.3078601,
    lng: location?.longitude || 69.2305837,
  });

  if (error) {
    return <ErrorComponent error={error} />;
  }

  if (!location) {
    return <LoadingComponent />;
  }

  return (
    <div className="p-4 space-y-4 flex flex-col mb-32">
      <h2 className="text-2xl font-bold mb-4">Near shops</h2>
      {shops.map((shop) => (
        <ShopCard key={shop.shopId} {...shop} />
      ))}
    </div>
  );
}
