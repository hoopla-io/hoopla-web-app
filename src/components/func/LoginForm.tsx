import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/func/PhoneInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth.context";

const phoneSchema = z.object({
  phoneNumber: z.string().min(9, "Invalid phone number"),
});

const codeSchema = z.object({
  code: z
    .string()
    .length(5, "Code must be 5 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
});

type Props = {
  /** Called after a successful code confirmation (e.g. to navigate). */
  onSuccess?: () => void;
};

export const LoginForm: FC<Props> = ({ onSuccess }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { login, confirmCode } = useAuth();
  const codeSectionRef = useRef<HTMLDivElement>(null);

  const phoneForm = useForm({ resolver: zodResolver(phoneSchema) });
  const codeForm = useForm({ resolver: zodResolver(codeSchema) });

  // When the code step appears, bring it into view within the sheet so the
  // input isn't left hidden below the keyboard / bottom edge.
  useEffect(() => {
    if (!sessionId) return;
    const id = requestAnimationFrame(() =>
      codeSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    );
    return () => cancelAnimationFrame(id);
  }, [sessionId]);

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
      onSuccess?.();
    } catch {
      toast.error("Invalid verification code");
    }
  };

  return (
    <>
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
        {!sessionId ? (
          /* Step 1 — Phone Number */
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
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </form>
          </Form>
        ) : (
          /* Step 2 — Verification Code (phone field hidden to free space) */
          <div ref={codeSectionRef}>
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
          </div>
        )}
      </div>
    </>
  );
};
