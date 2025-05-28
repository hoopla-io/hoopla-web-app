import toast from "react-hot-toast";

import { formatBalance } from "@/helpers/utils";
import { useNavigate } from "react-router-dom";
import { useSubscriptionBuy } from "@/api/hooks/subscriptions.hook";
import { Card, Button } from "@telegram-apps/telegram-ui";

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

const SubscriptionCard = ({
  id,
  name,
  price,
  currency,
  features,
}: SubscriptionCardProps) => {
  const navigate = useNavigate();

  const { buySubscription } = useSubscriptionBuy({
    onError: (error) => {
      if (error.code === 428) {
        toast.error(error.message);
        navigate("/payment-methods?amount=" + price);
      } else if (error.code === 412) {
        navigate("/login?from=/subscriptions");
      } else {
        toast.error(error.message);
      }
    },
  });
  return (
    <Card
      className="w-full rounded-lg shadow-md overflow-hidden"
      style={{
        backgroundColor: "var(--tg-theme-bg-color)",
        color: "var(--tg-theme-text-color)",
      }}
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-2xl font-bold mb-4">
          {formatBalance(price)} {currency}
        </p>
        <ul className="list-disc list-inside mb-6">
          {features?.map((feature) => (
            <li key={feature.id} className="text-sm mb-1">
              {feature.feature}
            </li>
          ))}
        </ul>
        <Button
          mode="filled"
          className="w-full text-background py-2 rounded font-medium"
          onClick={() => buySubscription(id)}
        >
          Subscribe
        </Button>
      </div>
    </Card>
  );
};

export default SubscriptionCard;
