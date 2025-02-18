import Link from 'next/link'

const TopBar = () => {
  return (
    <header className="bg-background text-text py-4 px-6 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">Coffee App</h1>
      <Link href="/subscriptions" className="bg-primary text-background px-3 py-1 rounded-full text-sm font-medium">
        Subscriptions
      </Link>
    </header>
  )
}

export default TopBar

