import SubscriptionCard from '../components/SubscriptionCard'

const subscriptions = [
  {
    id: 1,
    name: "Daily Brew Plan",
    description: "Perfect for the everyday coffee lover",
    price: "$19.99/month",
    features: [
      "1 cup of coffee per day",
      "Valid at all partner locations",
      "Espresso and Americano only"
    ]
  },
  {
    id: 2,
    name: "Weekend Warrior",
    description: "Fuel your weekends with premium coffee",
    price: "$14.99/month",
    features: [
      "2 cups of coffee per day on weekends",
      "Any coffee type",
      "10% discount on food items"
    ]
  },
  {
    id: 3,
    name: "Coffee Connoisseur",
    description: "For the true coffee aficionado",
    price: "$39.99/month",
    features: [
      "Unlimited coffee",
      "All coffee types and sizes",
      "Exclusive tastings and events"
    ]
  }
]

const SubscriptionsPage = () => {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
      {subscriptions.map(subscription => (
        <SubscriptionCard key={subscription.id} {...subscription} />
      ))}
    </div>
  )
}

export default SubscriptionsPage

