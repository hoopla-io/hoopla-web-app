'use client';

import { ChevronRight, Coffee, CreditCard, Receipt, User } from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';

import { useGetMe } from '@/app/profile/hooks/useGetMe';
import useTelegramApp from '@/hooks/useTelegramApp';

const ProfilePage = () => {
  const { user } = useTelegramApp();

  const { userInfo } = useGetMe();

  return (
    <div className="min-h-screen bg-subtle-bg text-text pb-20 mb-20">
      <Card className="rounded-none shadow-none bg-background">
        <CardContent className="pt-6 flex gap-4">
          <div className="flex flex-col items-start">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center bg-gray-400/10">
                {user?.photo_url ? (
                  <Image
                    src={user.photo_url}
                    alt="Profile Picture"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 justify-center">
            <p>
              <span className="font-semibold text-primary">Name: </span>
              <span>{user ? `${user.first_name} ${user.last_name || ''}` : userInfo?.name}</span>
            </p>
            <p>
              <span className="font-semibold text-primary">Phone: </span>
              <span>+{userInfo?.phoneNumber}</span>
            </p>
            <p>
              <span className="font-semibold text-primary">Balance: </span>
              <span>
                {userInfo?.balance} {userInfo?.currency}
              </span>
            </p>
            {user?.username && (
              <p>
                <span className="font-semibold text-primary">Username: </span>
                <span>{`@${user.username}`}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!userInfo?.subscription && (
        <Card className="mx-4 mt-8 bg-primary text-background">
          <CardContent className="p-6">
            <Link href="/subscriptions" className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">Subscriptions</h3>
              </div>
              <ChevronRight size={24} />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="px-4 mt-8">
        <h2 className="text-xl text-gray-500 mb-4">Manage Subscriptions</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <Link href="/subscriptions" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coffee className="text-primary" size={24} />
                  <span>My subscriptions</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Link href="/payment-methods" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-primary" size={24} />
                  <span>Payment Methods</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Link href="/payment-history" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="text-primary" size={24} />
                  <span>Payment History</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
