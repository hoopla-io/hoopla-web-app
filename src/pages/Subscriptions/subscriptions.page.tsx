import { useSubscriptions } from "@/api/hooks/subscriptions.hook";
import SubscriptionCard from "@/components/func/SubscriptionCard";
import { Page } from "@/components/Page";

export const SubscriptionsPage = () => {
  const { subscriptions } = useSubscriptions();

  if (!subscriptions) {
    return null;
  }

  return (
    <Page>
      <div className="px-4 py-8 space-y-6">
        {subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.id} {...subscription} />
        ))}
      </div>
    </Page>
  );
};
