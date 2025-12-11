type FetchResponse<T> =
  | { data: T; error?: never }
  | {
      data?: never;
      error: { message: string };
    };

type ListResponse<T> = {
  items: T[];
  total: number;
  range: { endPosition: number };
};

export async function fetchAllItems<T>({
  fetchPage,
  getId,
}: {
  fetchPage: (after?: number) => Promise<FetchResponse<ListResponse<T>>>;
  getId: (item: T) => string;
}): Promise<Array<T>> {
  const allItems: T[] = [];
  let after: number | undefined;
  while (true) {
    const response = await fetchPage(after);
    if (response.error) {
      throw new Error(`Error fetching items: ${response.error.message}`);
    }
    const {
      items,
      total,
      range: { endPosition },
    } = response.data;

    if (items[0]) {
      const firstItemId = getId(items[0]);
      const duplicate = allItems.find((item) => getId(item) === firstItemId);
      if (duplicate) {
        throw new Error("Infinite loop detected: duplicate item found");
      }
    }

    allItems.push(...items);
    if (allItems.length >= total) {
      break;
    }
    after = endPosition;
  }
  return allItems;
}
