import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { getAppURL } from "@lib/util/env";
import { Text, clx } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  });
  const productCategories = await listCategories();
  const appUrl = getAppURL();

  return (
    <footer className="border-t border-hairline bg-bg w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-14">
          <div>
            <LocalizedClientLink
              href="/"
              className="font-display text-[1.375rem] font-medium tracking-[-0.01em] text-forest transition-opacity hover:opacity-80"
            >
              Strengthiva
            </LocalizedClientLink>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="font-mono text-label uppercase text-muted">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return;
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null;

                    return (
                      <li
                        className="flex flex-col gap-2 text-muted text-sm"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "border-b border-transparent transition-colors hover:border-b-accent hover:text-forest",
                            children && "font-medium text-forest"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="border-b border-transparent transition-colors hover:border-b-accent hover:text-forest"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="font-mono text-label uppercase text-muted">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-muted text-sm",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="border-b border-transparent transition-colors hover:border-b-accent hover:text-forest"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="font-mono text-label uppercase text-muted">Strengthiva</span>
              <ul className="grid grid-cols-1 gap-y-2 text-muted text-sm">
                <li>
                  <a href={appUrl} className="border-b border-transparent transition-colors hover:border-b-accent hover:text-forest">
                    Health Assessment
                  </a>
                </li>
                <li>
                  <a href={`${appUrl}/diet-plans`} className="border-b border-transparent transition-colors hover:border-b-accent hover:text-forest">
                    Diet Plans
                  </a>
                </li>
                <li>
                  <LocalizedClientLink href="/account" className="border-b border-transparent transition-colors hover:border-b-accent hover:text-forest">
                    My Account
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between text-muted border-t border-hairline-soft pt-6">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Strengthiva. Modern Ayurvedic Wisdom.
          </Text>
        </div>
      </div>
    </footer>
  );
}
