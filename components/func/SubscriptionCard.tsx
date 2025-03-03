import toast from 'react-hot-toast';

import { useRouter } from 'next/navigation';

import { formatBalance } from '@/lib/utils';

import { useSubscriptionBuy } from '@/app/subscriptions/hooks/useSubscriptionBuy';

interface Feature {
  id: number;
  feature: string;
}

interface SubscriptionCardProps {
  id: number;
  name: string;
  price: number;
  currency: string;
  days: number;
  features: Feature[];
}

const SubscriptionCard = ({ id, name, price, currency, features }: SubscriptionCardProps) => {
  const router = useRouter();

  const { buySubscription } = useSubscriptionBuy({
    onError: error => {
      console.log({ error });

      toast.error(error.message);

      if (error.code === 422) {
        router.push('/payment-methods?amount=' + price);
      }
    },
  });
  return (
    <div className="bg-background rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-2xl font-bold mb-4">
          {formatBalance(price)} {currency}
        </p>
        <ul className="list-disc list-inside mb-6">
          {features?.map(feature => (
            <li key={feature.id} className="text-sm mb-1">
              {feature.feature}
            </li>
          ))}
        </ul>
        <button
          className="w-full bg-primary text-background py-2 rounded font-medium"
          onClick={() => buySubscription(id)}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;
