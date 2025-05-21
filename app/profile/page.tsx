'use client';

import {
  AlertCircle,
  ChevronRight,
  Coffee,
  CreditCard,
  LogOut,
  ReceiptText,
  ShieldEllipsis,
  Trash,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Image from 'next/image';
import Link from 'next/link';

import { useDeleteAccount } from './hooks/useDeleteAccount';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

import { useGetMe } from '@/app/profile/hooks/useGetMe';
import { useLogOut } from '@/app/profile/hooks/useLogOut';

const ProfilePage = () => {
  const { userInfo } = useGetMe();

  const { logout } = useLogOut({
    onError: error => {
      toast.error(error.message);
    },
  });

  const { deleteAccount } = useDeleteAccount({
    onError: error => {
      toast.error(error.message);
    },
  });

  if (!userInfo) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-subtle-bg text-text pb-20 mb-20">
      <Card className="shadow-md bg-background m-4 rounded-md">
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1 justify-center">
            <p className="font-semibold text-lg">{userInfo.name}</p>
            <p>
              <span className="font-light ">Phone Number: </span>
              <span className="font-semibold">+{userInfo.phoneNumber}</span>
            </p>
            <p>
              <span className="font-light">Balance: </span>
              <span className="font-semibold">
                {userInfo?.balance} {userInfo?.currency}
              </span>
            </p>
          </div>
          {userInfo?.subscription && (
            <div className="border-t border-x-stone-950 pt-4">
              <div className="flex flex-col justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span>Your subscription:</span>
                </div>
                <div className="flex justify-between">
                  <p className="text-xl font-bold">{userInfo.subscription?.name}</p>
                  <p>
                    (Active to:
                    {format(userInfo.subscription?.endDateUnix * 1000, 'dd.MM.yyyy, HH:mm')})
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!userInfo?.subscription && (
        <div className="mx-4 flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Buy a subscription</AlertTitle>
            <AlertDescription>You don&apos;t have any active subscription.</AlertDescription>
          </Alert>
          <Card className=" bg-primary text-background">
            <CardContent className="p-6">
              <Link href="/subscriptions" className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Subscriptions</h3>
                </div>
                <ChevronRight size={24} />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-4 mt-2">
        <div className="space-y-4">
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
              <Link
                href="https://hoopla.uz/en/privacy-policy"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <ShieldEllipsis className="text-primary" size={24} />
                  <span>Privacy Policy</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Link
                href="https://hoopla.uz/en/terms-of-use"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <ReceiptText className="text-primary" size={24} />
                  <span>Terms of Use</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <Separator className="my-8" />
      <div className="px-4 flex justify-end gap-4 ">
        <Button className="text-white" onClick={() => logout()}>
          <span>Logout</span>
          <LogOut size={20} />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="text-white">
              <span>Delete account</span>
              <Trash size={20} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove
                your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="text-white" onClick={() => deleteAccount()}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProfilePage;
