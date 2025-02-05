"use client";

import {
  Camera,
  ChevronRight,
  Coffee,
  Star,
  CreditCard,
  Receipt,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import useTelegramApp from "@/hooks/useTelegramApp";

const ProfilePage = () => {
  const { user } = useTelegramApp();

  const stats = {
    visits: 12,
    placesVisited: 3,
  };

  return (
    <div className="min-h-screen bg-subtle-bg text-text pb-20 mb-20">
      {/* Profile Header */}
      <Card className="rounded-none shadow-none bg-background">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <Image
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${
                    user?.first_name || "Guest"
                  }`}
                  alt={user?.first_name || "Guest"}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 bg-primary text-background p-2 rounded-full">
                <Camera size={20} />
              </button>
            </div>
            <h1 className="text-2xl font-semibold mt-4">
              {user ? `${user.first_name} ${user.last_name || ""}` : "Guest"}
            </h1>
            <p className="text-gray-500 mt-1">
              {user?.username ? `@${user.username}` : "No username"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex justify-center gap-12 mt-8">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-2">
            <Coffee className="w-6 h-6 text-background" />
          </div>
          <span className="text-2xl font-bold">{stats.visits}</span>
          <span className="text-gray-500 text-sm">Overall visits</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#FFC107] flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-background" />
          </div>
          <span className="text-2xl font-bold">{stats.placesVisited}</span>
          <span className="text-gray-500 text-sm">Places visited</span>
        </div>
      </div>

      {/* See Other Plans Card */}
      <Card className="mx-4 mt-8 bg-primary text-background">
        <CardContent className="p-6">
          <Link
            href="/subscriptions"
            className="flex justify-between items-center"
          >
            <div>
              <h3 className="text-xl font-semibold mb-2">See other plans</h3>
              <p className="text-sm opacity-90">
                Unlimited coffee from various cafes at an affordable price
              </p>
            </div>
            <ChevronRight size={24} />
          </Link>
        </CardContent>
      </Card>

      {/* Manage Subscriptions */}
      <div className="px-4 mt-8">
        <h2 className="text-xl text-gray-500 mb-4">Manage Subscriptions</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <Link
                href="/subscriptions"
                className="flex items-center justify-between"
              >
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
              <Link
                href="/payment-methods"
                className="flex items-center justify-between"
              >
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
              <Link
                href="/payment-history"
                className="flex items-center justify-between"
              >
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
