'use client';

import SubscriptionCard from '@/components/func/SubscriptionCard';

import { useSubscriptions } from '@/app/subscriptions/hooks/useSubscriptions';

// const subscriptions = [
//   {
//     id: 1,
//     name: "Daily Brew Plan",
//     price: 29000,
//     currency: "UZS",
//     days: 30,
//     features: [
//       {
//         id: 1,
//         feature: "1 cup per day",
//       },
//       {
//         id: 2,
//         feature: "Limited coffee shops",
//       },
//       {
//         id: 3,
//         feature: "Affordable and ideal for daily simplicity",
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "Weekend Warrior",
//     price: 99000,
//     currency: "UZS",
//     days: 7,
//     features: [
//       {
//         id: 1,
//         feature: "1 cup per day",
//       },
//       {
//         id: 2,
//         feature: "Limited coffee shops",
//       },
//       {
//         id: 3,
//         feature: "Affordable and ideal for daily simplicity",
//       },
//     ],
//   },
//   {
//     id: 3,
//     name: "Coffee Connoisseur",
//     price: 299000,
//     currency: "UZS",
//     days: 30,
//     features: [
//       {
//         id: 1,
//         feature: "1 cup per day",
//       },
//       {
//         id: 2,
//         feature: "Limited coffee shops",
//       },
//       {
//         id: 3,
//         feature: "Affordable and ideal for daily simplicity",
//       },
//     ],
//   },
// ];

const SubscriptionsPage = () => {
  const { subscriptions } = useSubscriptions();

  return (
    <div className="px-4 py-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
      {subscriptions.map(subscription => (
        <SubscriptionCard key={subscription.id} {...subscription} />
      ))}
    </div>
  );
};

export default SubscriptionsPage;
