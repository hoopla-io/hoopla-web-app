import { AlertCircle, Loader2 } from "lucide-react";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import QRCode from "react-qr-code";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePaymentSystems } from "@/api/hooks/payments.hook";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import PaymentApi from "@/api/domains/payment";
import { Page } from "@/components/Page";
import {
  Button,
  Card,
  Input,
  Modal,
  Placeholder,
} from "@telegram-apps/telegram-ui";

interface PaymentSystem {
  id: number;
  name: string;
  logoUrl: string;
}

const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^[0-9]+$/, "Must be a valid number"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export const PaymentSystemsPage: FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<PaymentSystem | null>(
    null
  );
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const { paymentSystems, isLoading, isError, error } = usePaymentSystems();

  const [searchParams] = useSearchParams();
  const amountFromQuery = searchParams.get("amount") || "";

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: amountFromQuery },
  });

  const handlePaymentSystemClick = (system: PaymentSystem) => {
    setSelectedSystem(system);
    setIsPaymentDrawerOpen(true);
    form.reset();
  };

  const handleAmountSubmit = async (values: PaymentFormValues) => {
    try {
      const data = await PaymentApi.topUpViaPaymentSystem(
        selectedSystem?.id || 0,
        Number(values.amount)
      );
      setCheckoutUrl(data.checkoutUrl);
      setIsPaymentDrawerOpen(false);
      setIsCheckoutDrawerOpen(true);
    } catch (error) {
      toast.error("Failed to top up via payment system");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error?.message}</p>
      </div>
    );
  }

  return (
    <Page>
      <div className="p-4">
        {Boolean(amountFromQuery) && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Choose a Payment System</AlertTitle>
              <AlertDescription>
                To continue, you must top up your account with this amount:{" "}
                {amountFromQuery}
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paymentSystems.map((system) => (
            <Card
              key={system.id}
              type="plain"
              className="rounded-lg flex flex-col items-center cursor-pointer"
              onClick={() => handlePaymentSystemClick(system)}
            >
              <img
                alt={system.name}
                src={system.logoUrl || "/placeholder.svg"}
              />
              <Card.Cell className="bg-[var(--tg-theme-bg-color)] w-full">
                {system.name}
              </Card.Cell>
            </Card>
          ))}
        </div>

        {/* Payment Drawer */}
        <Modal open={isPaymentDrawerOpen} onOpenChange={setIsPaymentDrawerOpen}>
          <Placeholder
            header="Payment"
            description="Enter amount to top up"
            className="pb-0"
          />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAmountSubmit)}
              className="p-4 gap-4 flex flex-col"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                mode="filled"
                type="submit"
                className="text-white w-full py-6"
              >
                Proceed to Payment
              </Button>
            </form>
          </Form>
        </Modal>

        {/* Checkout Drawer */}
        <Modal
          open={isCheckoutDrawerOpen}
          onOpenChange={setIsCheckoutDrawerOpen}
        >
          <Placeholder
            header="Checkout"
            description="Scan the QR code or pay via the website."
          />
          <div className="flex flex-col items-center justify-center gap-4 pt-2 pb-4 px-6">
            {checkoutUrl && (
              <QRCode
                value={checkoutUrl}
                size={180}
                className="border p-2 bg-white"
              />
            )}
            <RouterLink
              to={checkoutUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white w-full h-full mt-4"
            >
              <Button className="w-full">Pay via Website</Button>
            </RouterLink>
          </div>
        </Modal>
      </div>
    </Page>
  );
};
