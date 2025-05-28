import {
  CreditCard,
  LogOut,
  PlusCircle,
  ReceiptText,
  ShieldEllipsis,
  Trash,
} from "lucide-react";
import toast from "react-hot-toast";

import { format } from "date-fns";

import {
  useDeleteAccount,
  useGetMe,
  useLogOut,
} from "@/api/hooks/profile.hook";
import { FC, useState } from "react";
import {
  Button,
  ButtonCell,
  Card,
  Cell,
  Divider,
  List,
  Modal,
  Placeholder,
  Section,
} from "@telegram-apps/telegram-ui";
import { CardContent } from "@/components/ui/card";
import { Link } from "@/components/Link/Link";
import { ModalHeader } from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader";
import { useNavigate } from "react-router-dom";
import { Page } from "@/components/Page";
import { formatBalance } from "@/helpers/utils";
import { LoadingScreen } from "@/components/func/Loading";
import { Link as RouterLink } from "react-router-dom";

export const ProfilePage: FC = () => {
  const { userInfo, isLoading } = useGetMe();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const { logout } = useLogOut({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { deleteAccount } = useDeleteAccount({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading || !userInfo) {
    return (
      <LoadingScreen header="Loading Profile" description="Please wait..." />
    );
  }

  return (
    <Page>
      <div className="min-h-screen my-24 mx-4">
        <Card className="shadow-md rounded-md w-full bg-[var(--tg-theme-bg-color)]">
          <CardContent className="py-4 px-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1 justify-center">
              <p className="font-semibold text-xl">{userInfo.name}</p>
              <p>
                <span className="font-light ">Phone Number: </span>
                <span className="font-semibold text-[var(--tg-theme-link-color)]">
                  +{userInfo.phoneNumber}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-2 items-start">
          <Card className="shadow-md rounded-md w-full bg-[var(--tg-theme-bg-color)] mt-2">
            <CardContent className="py-2 px-2 flex flex-col gap-4">
              {/* {userInfo.subscription && (
                <div className="flex flex-col justify-between gap-2">
                  <div className="text-lg font-bold">Subscription:</div>
                  <div className="flex flex-col justify-between gap-2">
                    <p className="text-lg font-bold text-[var(--tg-theme-link-color)]">
                      {userInfo.subscription?.name}
                    </p>
                    <Divider />
                    <div>
                      <p> Active to:</p>
                      <p>
                        {format(
                          userInfo.subscription?.endDateUnix * 1000,
                          "MMM d, yyyy"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )} */}
              {userInfo.subscription && (
                <div className="flex flex-col justify-between gap-2">
                  <div className="text-lg font-bold">Subscription:</div>
                  <div className="flex flex-col justify-between gap-5">
                    <p className="text-lg font-bold text-[var(--tg-theme-link-color)]">
                      Free
                    </p>
                    <Button
                      mode="gray"
                      before={<PlusCircle />}
                      onClick={() => {
                        navigate("/subscriptions");
                      }}
                    >
                      Select Plan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-md rounded-md w-full bg-[var(--tg-theme-bg-color)] mt-2">
            <CardContent className="py-2 px-2 flex flex-col gap-4">
              <div className="flex flex-col justify-between gap-2 p-0">
                <div className="text-lg font-bold">Balance:</div>
                <div className="flex flex-col justify-between gap-5">
                  <p className="text-lg font-bold text-[var(--tg-theme-link-color)]">
                    {formatBalance(userInfo?.balance)} {userInfo?.currency}
                  </p>
                  <Button
                    mode="gray"
                    before={<PlusCircle />}
                    onClick={() => {
                      navigate("/payment-methods");
                    }}
                  >
                    Top Up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className=" mt-2">
          <List
            style={{
              background: "var(--tgui--bg_color)",
              padding: 2,
            }}
            className="rounded-md"
          >
            <Section header="Main Settings">
              <Link
                to="/payment-methods"
                className="text-[var(--tg-theme-text-color)]"
              >
                <Cell
                  before={<CreditCard />}
                  subtitle="You can top up your balance here"
                  onClick={() => {
                    navigate("/payment-methods");
                  }}
                >
                  Payment Methods
                </Cell>
              </Link>
              <Link
                to="/privacy-policy"
                className="text-[var(--tg-theme-text-color)]"
              >
                <Cell
                  before={<ShieldEllipsis />}
                  subtitle="You can read more about our privacy policy here"
                >
                  Privacy policy
                </Cell>
              </Link>
              <Link
                to="/terms-of-use"
                className="text-[var(--tg-theme-text-color)]"
              >
                <Cell
                  before={<ReceiptText />}
                  subtitle="You can read more about our terms of use here"
                >
                  Terms of use
                </Cell>
              </Link>
              <RouterLink
                to="https://t.me/alphazzet"
                target="_blank"
                className="text-[var(--tg-theme-text-color)]"
              >
                <Cell
                  before={<CreditCard />}
                  subtitle="Contact us if you have any questions"
                  onClick={() => {
                    navigate("/payment-methods");
                  }}
                >
                  Help
                </Cell>
              </RouterLink>
              <div className="grid grid-cols-2 gap-2">
                <ButtonCell
                  before={<LogOut />}
                  mode="destructive"
                  onClick={() => logout()}
                >
                  Log out
                </ButtonCell>
                <Modal
                  header={<ModalHeader>Delete Account</ModalHeader>}
                  trigger={
                    <ButtonCell before={<Trash />} mode="destructive">
                      Delete
                    </ButtonCell>
                  }
                  open={isModalOpen}
                  onOpenChange={setIsModalOpen}
                >
                  <Placeholder
                    header="Are you sure ?"
                    description="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
                  />
                  <div className="grid grid-cols-2 gap-4 p-4">
                    <Button
                      mode="bezeled"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button mode="filled" onClick={() => deleteAccount()}>
                      Continue
                    </Button>
                  </div>
                </Modal>
              </div>
            </Section>
          </List>
        </div>
      </div>
    </Page>
  );
};
