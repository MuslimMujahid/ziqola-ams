import React from "react";
import { useNavigate } from "@tanstack/react-router";

function cleanSearch<TSearch extends Record<string, string | undefined>>(
  search: TSearch,
): TSearch {
  const cleaned = Object.fromEntries(
    Object.entries(search).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );

  return cleaned as TSearch;
}

export function useUrlSearchState<
  TSearch extends Record<string, string | undefined>,
>() {
  const navigate = useNavigate();

  const setSearch = React.useCallback(
    (updates: Partial<TSearch>) => {
      navigate({
        search: ((prev: Record<string, string | undefined>) =>
          cleanSearch({ ...prev, ...updates } as TSearch)) as unknown as never,
      });
    },
    [navigate],
  );

  return { setSearch };
}
