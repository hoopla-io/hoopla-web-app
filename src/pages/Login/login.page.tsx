import { Loader2, Phone, ShieldCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth.context";
import { PhoneInput } from "@/components/func/PhoneInput";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";

const phoneSchema = z.object({
  phoneNumber: z.string().min(9, "Invalid phone number"),
});

const codeSchema = z.object({
  code: z
    .string()
    .length(5, "Code must be 5 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
});

export const LoginPage: FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectUrl = params.get("from");
  const { isAuthenticated, login, confirmCode } = useAuth();

  const phoneForm = useForm({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm({ resolver: zodResolver(codeSchema) });

  const handleNavigateAfterLogin = (url?: string | null) => {
    navigate(url || "/profile");
  };

  if (isAuthenticated) {
    handleNavigateAfterLogin(redirectUrl);
  }

  const onPhoneSubmit = async (data: { phoneNumber: string }) => {
    try {
      const cleaned = data.phoneNumber.replace(/\+/g, "");
      const { sessionId } = await login(cleaned);
      setSessionId(sessionId);
    } catch {
      toast.error("Invalid phone number");
    }
  };

  const onCodeSubmit = async (data: { code: string }) => {
    try {
      await confirmCode(sessionId!, Number(data.code));
      handleNavigateAfterLogin(redirectUrl);
    } catch {
      toast.error("Invalid verification code");
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]">
      <div className="w-full max-w-md mx-4">
        <h1 className="text-center font-eugusto text-4xl text-white mb-8 tracking-wide">
          hoopla
        </h1>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">
              {sessionId
                ? "Enter the verification code to continue"
                : "Enter your phone number to get started"}
            </p>
          </div>

          <div className="h-px bg-gray-100 mx-6" />

          <div className="p-6 space-y-5">
            {/* Phone Number */}
            <Form {...phoneForm}>
              <form
                onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={phoneForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <label className="text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <FormControl>
                        <PhoneInput
                          {...field}
                          placeholder="Phone Number"
                          countries={["UZ"]}
                          defaultCountry="UZ"
                          disabled={!!sessionId}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!sessionId ? (
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium text-white rounded-xl"
                    disabled={phoneForm.formState.isSubmitting}
                  >
                    {phoneForm.formState.isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Phone size={18} />
                        Send Code
                      </>
                    )}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSessionId(null);
                      codeForm.reset();
                    }}
                    className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Change number
                  </button>
                )}
              </form>
            </Form>

            {/* Verification Code */}
            {sessionId && (
              <>
                <div className="h-px bg-gray-100" />

                <Form {...codeForm}>
                  <form
                    onSubmit={codeForm.handleSubmit(onCodeSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={codeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-medium text-gray-700">
                            Verification Code
                          </label>
                          <FormControl>
                            <Input
                              {...field}
                              autoFocus
                              type="tel"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="12345"
                              className="h-12 rounded-xl text-base px-4 tracking-[0.3em] text-center font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium text-white rounded-xl"
                      disabled={codeForm.formState.isSubmitting}
                    >
                      {codeForm.formState.isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          Verify
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
