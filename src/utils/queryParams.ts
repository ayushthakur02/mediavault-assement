import { SORTS, STATUSES } from "@/constants/assets.constants";
import { AssetQuery, AssetStatus } from "@/lib/types";

type InitialQuery = {
  q: string;
  status: AssetStatus[];
  sort: NonNullable<AssetQuery["sort"]>;
};
export function updateQueryParams(query: AssetQuery) {
  const filteredQuery = {
    ...(query.q ? { q: query.q } : {}),
    ...(query.status?.length ? { status: query.status } : {}),
    ...(query.kind?.length ? { kind: query.kind.join(",") } : {}),
    ...(query.tag?.length ? { tag: query.tag.join(",") } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
  };
  const newParams = new URLSearchParams(
    filteredQuery as Record<string, string>,
  ).toString();
  console.log("newParams", newParams);
  console.log("filteredQuery", filteredQuery);
  console.log("query", query);
  window.history.replaceState({}, "", `?${newParams}`);
}

export function getInitialQueryFromUrl(): InitialQuery {
  const params = new URLSearchParams(window.location.search);

  const q = params.get("q") ?? "";

  const statusParam = params.get("status");
  const status: AssetStatus[] = statusParam
    ? statusParam
        .split(",")
        .filter((s): s is AssetStatus => STATUSES.includes(s as AssetStatus))
    : [];

  const urlSort = params.get("sort");

  const sort: NonNullable<AssetQuery["sort"]> = SORTS.some(
    (item) => item.value === urlSort,
  )
    ? (urlSort as NonNullable<AssetQuery["sort"]>)
    : "updatedAt:desc";

  return { q, status, sort };
}
