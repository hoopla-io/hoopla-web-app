import { type PropsWithChildren } from "react";

export function Page({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
