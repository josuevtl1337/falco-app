import { lazy, ComponentType } from "react";

export function lazyPage<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(importer);
}
