import { FC, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AuthApi } from "@/api/domains/auth";
import { useAuth } from "@/context/auth.context";
import { useGetMe } from "@/api/hooks/profile.hook";
import { DEFAULT_USER_NAME } from "@/helpers/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

/**
 * Global Edit Profile drawer. Opened from the profile page edit button and
 * automatically right after sign-in when the user still has the default name.
 * Shows a welcome message in the onboarding case, "Edit Profile" otherwise.
 */
export const EditProfileModal: FC = () => {
  const { isEditProfileOpen, closeEditProfile } = useAuth();
  const { userInfo } = useGetMe();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Load current values whenever the drawer opens.
  useEffect(() => {
    if (!isEditProfileOpen) return;
    let active = true;
    setLoading(true);
    AuthApi.getEditProfile()
      .then((data) => {
        if (!active) return;
        const isDefault =
          data.name?.trim().toLowerCase() === DEFAULT_USER_NAME;
        setIsOnboarding(isDefault);
        // Start from a blank field during onboarding so the user types fresh.
        setName(isDefault ? "" : data.name || "");
        setGender(data.gender || "");
        setDob(data.dateOfBirth || "");
      })
      .catch(() => {
        if (!active) return;
        // Fall back to the known name so a failed load doesn't blank the field.
        const known = userInfo?.name ?? "";
        const isDefault = known.trim().toLowerCase() === DEFAULT_USER_NAME;
        setIsOnboarding(isDefault);
        setName(isDefault ? "" : known);
        toast.error("Couldn't load your profile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEditProfileOpen]);

  const updateProfile = useMutation({
    mutationFn: () =>
      AuthApi.updateProfile({
        name: name || undefined,
        gender: gender || undefined,
        dateOfBirth: dob || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-me"] });
      toast.success(isOnboarding ? "Welcome aboard!" : "Profile updated");
      closeEditProfile();
    },
    onError: () => toast.error("Failed to update profile"),
  });

  return (
    <Drawer
      open={isEditProfileOpen}
      onOpenChange={(open) => {
        if (!open) closeEditProfile();
      }}
    >
      <DrawerContent className="pb-6">
        <div className="w-full max-w-md mx-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {isOnboarding ? "Welcome to hoopla 👋" : "Edit Profile"}
            </DrawerTitle>
            <DrawerDescription>
              {isOnboarding
                ? "Set up your profile so we know what to call you."
                : "Update your personal information."}
            </DrawerDescription>
          </DrawerHeader>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4 px-4 pt-1">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus={isOnboarding}
                  className="h-11 rounded-xl mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="flex gap-2 mt-1">
                  {["male", "female"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 h-11 rounded-xl text-sm font-medium border transition-colors ${
                        gender === g
                          ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="h-11 rounded-xl mt-1"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl text-base font-medium text-white"
                disabled={updateProfile.isPending}
                onClick={() => updateProfile.mutate()}
              >
                {updateProfile.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isOnboarding ? (
                  "Get started"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
