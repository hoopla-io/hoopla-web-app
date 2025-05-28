import { X } from "lucide-react";
import { FC, useRef, useState } from "react";

import debounce from "lodash/debounce";

import ShopCard from "@/components/func/ShopCard";
import { useShops } from "@/api/hooks/shops.hook";
import { Page } from "@/components/Page";
import {
  Input,
  List,
  Placeholder,
  Section,
  Tappable,
} from "@telegram-apps/telegram-ui";
import { LocationSettings, useLocation } from "@/context/location.context";
import { LoadingScreen } from "@/components/func/Loading";

// const LoadingScreen = () => {
//   return (
//     <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-6 space-y-6">
//       {/* Loading Text */}
//       <div className="text-center space-y-2">
//         <h3 className="text-xl font-semibold">Discovering Coffee Shops</h3>
//         <p className="text-sm text-gray-500">
//           Finding the perfect brew near you...
//         </p>
//       </div>

//       {/* Loading Bar */}
//       <Spinner size="m" />
//     </div>
//   );
// };

const ErrorComponent = (props: { error: string }) => {
  const { error } = props;
  return (
    <div className="p-4 text-center flex flex-col items-center justify-center gap-2">
      <p className="text-red-500">{error}</p>
      <p>
        We can&apos;t show nearby shops without your location. Please enable
        location services and refresh the page.
      </p>
      <div className="w-full ">
        <LocationSettings />
      </div>
    </div>
  );
};

export const ShopsPage: FC = () => {
  const [searchText, setSearchText] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  const { location, error } = useLocation();

  const { shops = [] } = useShops({
    latitude: location?.latitude,
    longitude: location?.longitude,
    name: searchText,
  });

  if (error && !location) {
    return <ErrorComponent error={error} />;
  }

  if (!location) {
    return (
      <LoadingScreen
        header="Discovering Coffee Shops"
        description="Finding the perfect brew near you..."
      />
    );
  }

  const debouncedInputChange = debounce(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setSearchText(value);
    },
    500
  );

  const debouncedClearInput = debounce(() => {
    if (searchRef.current) {
      searchRef.current.value = "";
    }
    setSearchText("");
  }, 500);

  return (
    <Page>
      <List>
        <Input
          ref={searchRef}
          onInput={debouncedInputChange}
          header="Search"
          placeholder="Write shop's name here"
          after={
            <Tappable
              Component="div"
              style={{
                display: "flex",
              }}
              onClick={debouncedClearInput}
            >
              <X />
            </Tappable>
          }
        />
      </List>
      {shops.length > 0 && (
        <Section header="Nearby Shops">
          {shops.map((shop, index) => (
            <div key={index} className="m-0 bg-transparent px-6 mb-4">
              <ShopCard key={index} {...shop} />
            </div>
          ))}
        </Section>
      )}

      {shops.length === 0 && (
        <Section>
          <Placeholder
            header="Oops"
            description="Try searching for a different name."
          >
            <img
              alt="Telegram sticker"
              src="https://xelene.me/telegram.gif"
              style={{ display: "block", width: "144px", height: "144px" }}
            />
          </Placeholder>
        </Section>
      )}
    </Page>
  );
};
