import { Card } from "@telegram-apps/telegram-ui";
import { Coffee, Gem, MapPin } from "lucide-react";

import { Link } from "@/components/Link/Link";
import { CardChip } from "@telegram-apps/telegram-ui/dist/components/Blocks/Card/components/CardChip/CardChip";
import { CardCell } from "@telegram-apps/telegram-ui/dist/components/Blocks/Card/components/CardCell/CardCell";

type Module = {
  moduleId: number;
  name: "Lite" | "Pro";
  colour: string;
};

interface ShopCardProps {
  shopId: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  modules: Module[];
}

const ModuleIcons = {
  Lite: <Coffee size={16} />,
  Pro: <Gem size={16} />,
};

const ShopCard = ({
  shopId,
  name,
  pictureUrl,
  distance,
  modules,
}: ShopCardProps) => {
  return (
    <Link to={`/shops/${shopId}`}>
      <Card type="plain">
        {modules && (
          <CardChip readOnly className="bg-[var(--tg-theme-bg-color)]">
            {modules.map((module) => {
              return (
                <div key={module.moduleId} className={`w-4 h-4 rounded-full`}>
                  {ModuleIcons[module.name]}
                </div>
              );
            })}
          </CardChip>
        )}
        <img
          alt={name}
          src={pictureUrl}
          style={{
            display: "block",
            height: 308,
            objectFit: "cover",
          }}
        />
        <CardCell readOnly className="bg-[var(--tg-theme-bg-color)]">
          <h3 className="text-xl font-semibold mb-1 text-[var(--tg-theme-text-color)]">
            {name}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin size={16} className="mr-1" />
            <p>
              {distance > 1
                ? `${distance.toFixed(1)} km from you`
                : `${(distance * 100).toFixed(1)}m from you`}
            </p>
          </div>
        </CardCell>
      </Card>
    </Link>
  );
};

export default ShopCard;
