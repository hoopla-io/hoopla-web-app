import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface SearchContextType {
  searchText: string;
  setSearchText: (value: string) => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchText, setSearchText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { pathname } = useLocation();

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchText("");
  };

  // Reset the search whenever the route changes so it never lingers open
  // (e.g. after tapping a shop card) or carries a stale query to another page.
  // Guarded so an idle navigation doesn't trigger redundant re-renders.
  useEffect(() => {
    setIsSearchOpen((open) => (open ? false : open));
    setSearchText((text) => (text ? "" : text));
  }, [pathname]);

  return (
    <SearchContext.Provider
      value={{ searchText, setSearchText, isSearchOpen, openSearch, closeSearch }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return ctx;
};
