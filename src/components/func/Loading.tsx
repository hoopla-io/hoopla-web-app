import { Spinner } from "@telegram-apps/telegram-ui";

type LoadingScreenProps = {
  header: string;
  description: string;
};

export const LoadingScreen = (props: LoadingScreenProps) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">{props.header}</h3>
        <p className="text-sm text-gray-500">{props.description}</p>
      </div>

      <Spinner size="m" />
    </div>
  );
};
