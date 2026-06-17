import {
  LogOut,
  Trash,
  User,
  CreditCard,
  Crown,
  Pencil,
  Wallet,
  ShieldCheck,
  FileText,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FC, useState } from "react";
import { Link } from "react-router-dom";

import {
  useDeleteAccount,
  useGetMe,
  useLogOut,
} from "@/api/hooks/profile.hook";
import { usePaymentSystems } from "@/api/hooks/payments.hook";
import { useAuth } from "@/context/auth.context";
import PaymentApi from "@/api/domains/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Page } from "@/components/Page";
import { formatBalance } from "@/helpers/utils";
import { LoadingScreen } from "@/components/func/Loading";

export const ProfilePage: FC = () => {
  const { userInfo, isLoading } = useGetMe();
  const { openEditProfile } = useAuth();

  const { logout } = useLogOut({
    onError: (error) => toast.error(error.message),
  });

  const { deleteAccount } = useDeleteAccount({
    onError: (error) => toast.error(error.message),
  });

  // Top-up state
  const { paymentSystems } = usePaymentSystems();
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);

  const handleTopUp = async (paymentId: number) => {
    const amount = Number(topUpAmount);
    if (!amount || amount < 1000) {
      toast.error("Minimum amount is 1,000 UZS");
      return;
    }
    try {
      const result: any = await PaymentApi.topUpViaPaymentSystem(
        paymentId,
        amount
      );
      if (result?.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
        setTopUpOpen(false);
        setTopUpAmount("");
      }
    } catch {
      toast.error("Failed to initiate payment");
    }
  };

  if (isLoading || !userInfo) {
    return (
      <LoadingScreen header="Loading Profile" description="Please wait..." />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-32">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary)] px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {userInfo.name}
                  </h2>
                  <p className="text-white/80 text-sm mt-0.5">
                    +{userInfo.phoneNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={openEditProfile}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Pencil size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                <Crown size={16} className="text-[var(--color-primary)]" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Plan
              </span>
            </div>
            {userInfo.subscription ? (
              <>
                <p className="text-lg font-bold text-[var(--color-primary)]">
                  {userInfo.subscription.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Until{" "}
                  {format(
                    userInfo.subscription.endDateUnix * 1000,
                    "MMM d, yyyy"
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-gray-400">Free</p>
                <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Coming soon
                </span>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                <CreditCard
                  size={16}
                  className="text-[var(--color-primary)]"
                />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Balance
              </span>
            </div>
            <p className="text-lg font-bold text-[var(--color-primary)]">
              {formatBalance(userInfo?.balance)}
            </p>
            <p className="text-xs text-gray-400 mt-1 uppercase">
              {userInfo?.currency}
            </p>
            <button
              onClick={() => setTopUpOpen(true)}
              className="mt-3 w-full h-9 rounded-xl text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              + Top Up
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="mt-3 space-y-2">
          <Button
            variant="outline"
            className="w-full h-12 justify-between rounded-2xl bg-white border-none shadow-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setTopUpOpen(true)}
          >
            <span className="flex items-center gap-3">
              <Wallet size={18} className="text-gray-400" />
              Top up balance
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </Button>

          <Link to="/privacy-policy">
            <Button
              variant="outline"
              className="w-full h-12 justify-between rounded-2xl bg-white border-none shadow-sm text-gray-700 hover:bg-gray-50 mt-2"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-gray-400" />
                Privacy Policy
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </Button>
          </Link>

          <Link to="/terms-of-use">
            <Button
              variant="outline"
              className="w-full h-12 justify-between rounded-2xl bg-white border-none shadow-sm text-gray-700 hover:bg-gray-50 mt-2"
            >
              <span className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                Terms of Use
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </Button>
          </Link>
        </div>

        {/* Danger zone */}
        <div className="mt-3 space-y-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 justify-start gap-3 rounded-2xl bg-white border-none shadow-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={18} className="text-gray-400" />
                Log out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl text-white"
                  onClick={() => logout()}
                >
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 justify-start gap-3 rounded-2xl bg-white border-none shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash size={18} />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your account and all data will be
                  permanently removed from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                  onClick={() => deleteAccount()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Top Up Drawer */}
        <Drawer open={topUpOpen} onOpenChange={setTopUpOpen}>
          <DrawerContent className="pb-6">
            <div className="w-full max-w-md mx-auto">
              <DrawerHeader className="text-left">
                <DrawerTitle>Top Up Balance</DrawerTitle>
                <DrawerDescription>
                  Enter amount and select payment method
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-4 pt-1">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Amount (UZS)
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="10000"
                  className="h-11 rounded-xl mt-1 text-base"
                />
              </div>
              <div className="flex gap-2">
                {[10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(String(amt))}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium border transition-colors ${
                      topUpAmount === String(amt)
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {formatBalance(amt)}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <div className="space-y-2 mt-2">
                  {paymentSystems.map((ps) => (
                    <button
                      key={ps.id}
                      onClick={() => handleTopUp(ps.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={ps.logoUrl}
                        alt={ps.name}
                        className="w-10 h-10 rounded-lg object-contain"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        Pay with {ps.name}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-gray-400 ml-auto"
                      />
                    </button>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </Page>
  );
};
