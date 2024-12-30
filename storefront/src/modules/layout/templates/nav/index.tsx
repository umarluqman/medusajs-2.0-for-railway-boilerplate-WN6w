"use client"

import { Popover, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { usePathname } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

type NavProps = {
  regions: any[]
  region: any
  customer: any
}

export default function Nav({ regions, region, customer }: NavProps) {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 basis-0 h-full flex items-center">
              <div className="h-full">
                <SideMenu regions={regions} />
              </div>
            </div>

            <div className="flex items-center h-full">
              <LocalizedClientLink
                href="/"
                className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"
              >
                Medusa Store
              </LocalizedClientLink>
            </div>

            <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
              <div className="hidden small:flex items-center gap-x-6 h-full">
                {process.env.FEATURE_SEARCH_ENABLED && (
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/search"
                    scroll={false}
                  >
                    Search
                  </LocalizedClientLink>
                )}
                <LocalizedClientLink
                  className="hover:text-ui-fg-base"
                  href="/store"
                >
                  Store
                </LocalizedClientLink>
                {customer ? (
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/account"
                  >
                    Account
                  </LocalizedClientLink>
                ) : (
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/account/login"
                  >
                    Login
                  </LocalizedClientLink>
                )}
              </div>
              <CartButton />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
