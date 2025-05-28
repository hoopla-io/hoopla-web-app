import { Loader2 } from "lucide-react";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import * as z from "zod";
import { useAuth } from "@/context/auth.context";
import { PhoneInput } from "@/components/func/PhoneInput";
import { Button } from "@telegram-apps/telegram-ui";
import { useNavigate, useSearchParams } from "react-router-dom";

const phoneSchema = z.object({
  phoneNumber: z.string().min(9, "Invalid phone number"),
});

const codeSchema = z.object({
  code: z.string().length(5, "Code must be 5 digits"),
});

function PhoneForm({ onSuccess }: { onSuccess: (sessionId: string) => void }) {
  const { login } = useAuth();
  const form = useForm({ resolver: zodResolver(phoneSchema) });

  const onSubmit = async (data: { phoneNumber: string }) => {
    try {
      const sterilizedPhoneNumber = data.phoneNumber.replace(/\+/g, "");
      const { sessionId } = await login(sterilizedPhoneNumber);
      onSuccess(sessionId);
    } catch {
      toast.error("Invalid phone number");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PhoneInput
                  {...field}
                  placeholder="Phone Number"
                  countries={["UZ"]}
                  defaultCountry="UZ"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          mode="filled"
          type="submit"
          className="w-full text-white"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            "Send Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function CodeForm({
  sessionId,
  onSuccess,
}: {
  sessionId: string;
  onSuccess?: () => void;
}) {
  const { confirmCode } = useAuth();
  const form = useForm({ resolver: zodResolver(codeSchema) });

  const onSubmit = async (data: { code: string }) => {
    try {
      await confirmCode(sessionId, Number(data.code));
      onSuccess?.();
    } catch {
      toast.error("Invalid verification code");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex justify-center">
                  <InputOTP
                    autoFocus
                    maxLength={5}
                    pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                    {...field}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full text-white"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            "Verify"
          )}
        </Button>
      </form>
    </Form>
  );
}

export const LoginPage: FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const navigate = useNavigate();

  const [params] = useSearchParams();
  const redirectUrl = params.get("from");

  const { isAuthenticated } = useAuth();

  const handleNavigateAfterLogin = (redirectUrl?: string | null) => {
    if (redirectUrl) {
      navigate(redirectUrl);
    } else {
      navigate("/profile");
    }
  };

  if (isAuthenticated) {
    handleNavigateAfterLogin(redirectUrl);
  }

  return (
    <div className="fixed inset-0 z-[999] w-full h-[100vh] bg-[var(--tg-theme-secondary-bg-color)]  flex items-center justify-center shadow-2xl">
      <div className="bg-[var(--tg-theme-bg-color)] p-6 rounded-lg w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {sessionId ? "Enter Verification Code" : "Enter Phone Number"}
        </h2>
        {!sessionId ? (
          <PhoneForm onSuccess={setSessionId} />
        ) : (
          <CodeForm
            sessionId={sessionId}
            onSuccess={() => handleNavigateAfterLogin(redirectUrl)}
          />
        )}
      </div>
    </div>
  );
};
