interface SubscriptionCardProps {
  name: string
  description: string
  price: string
  features: string[]
}

const SubscriptionCard = ({ name, description, price, features }: SubscriptionCardProps) => {
  return (
    <div className="bg-background rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <p className="text-2xl font-bold mb-4">{price}</p>
        <ul className="list-disc list-inside mb-6">
          {features.map((feature, index) => (
            <li key={index} className="text-sm mb-1">{feature}</li>
          ))}
        </ul>
        <button className="w-full bg-primary text-background py-2 rounded font-medium">
          Subscribe
        </button>
      </div>
    </div>
  )
}

export default SubscriptionCard

