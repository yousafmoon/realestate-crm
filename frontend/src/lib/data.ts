import { getProperties } from "@/lib/api";
import type { Property } from "@/lib/types";

export async function getAllProperties(): Promise<Property[]> {
  const firstPage = await getProperties({ page: 1, limit: 100 });
  if (firstPage.pages <= 1) return firstPage.items;

  const laterPages = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      getProperties({ page: index + 2, limit: 100 }),
    ),
  );
  return firstPage.items.concat(...laterPages.map((page) => page.items));
}