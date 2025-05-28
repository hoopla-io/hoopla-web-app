import { FC } from "react";
import { Button, FixedLayout } from "@telegram-apps/telegram-ui";
import { Link } from "@/components/Link/Link";

export const Header: FC = () => {
  return (
    <FixedLayout
      vertical="top"
      style={{
        backgroundColor: "var(--tg-theme-bg-color)",
        zIndex: 10,
      }}
      className="shadow-md"
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link
            to="/"
            className="flex items-center space-x-2 font-eugusto text-2xl text-[var(--tg-theme-text-color)]"
          >
            hoopla
          </Link>
          <Link
            to="/subscriptions"
            className="text-white transition-colors font-bold"
          >
            <Button mode="filled">Subscriptions</Button>
          </Link>
        </div>
      </div>
    </FixedLayout>
  );
};
