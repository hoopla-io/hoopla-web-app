import { FC, FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Masked phone the code went to, e.g. "*3929". */
  phone?: string;
  pending: boolean;
  error: string | null;
  onSubmit: (otp: string) => void;
}

/** Asks for the SMS code the bank sends when a saved card payment needs one. */
export const PaymentOtpDrawer: FC<Props> = ({ open, onOpenChange, phone, pending, error, onSubmit }) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (open) setOtp("");
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (otp.length < 4 || pending) return;
    onSubmit(otp);
  };

  return (
    <Drawer open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DrawerContent className="pb-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t("payment.otpTitle")}</DrawerTitle>
            <DrawerDescription>
              {phone
                ? t("payment.otpDescription", { phone })
                : t("payment.otpDescriptionNoPhone")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 pt-1">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder={t("payment.otpPlaceholder")}
              className="h-12 rounded-xl text-center text-lg tracking-[0.4em] placeholder:text-base placeholder:tracking-normal"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={otp.length < 4 || pending} className="h-12 w-full rounded-xl">
              {pending ? <Loader2 size={18} className="animate-spin" /> : t("payment.confirm")}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
