"use client"

import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

/*
  Client-side chrome state for the store redesign — the pieces store.js kept on
  `window`: the toast, the cart drawer, the mobile menu, and the wishlist.

  The cart itself is NOT here: it is the real Medusa cart, read on the server
  (Nav → CartDrawer) and refreshed by the add/update/delete server actions'
  revalidateTag. `addItems` only wraps those actions with the drawer + toast
  feedback the prototype gave on "Add to cart".

  The wishlist stays device-local (localStorage), exactly as in the prototype —
  Medusa has no wishlist model and there is no account-synced one yet.
*/

const WISH_KEY = "strengthiva_wishlist"

type AddItem = { variantId: string; quantity?: number }

type StoreUI = {
  toast: (message: string) => void
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  menuOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  wishlist: string[]
  isWished: (productId: string) => boolean
  toggleWish: (productId: string) => void
  /** Adds one or more variants to the Medusa cart, then opens the drawer. */
  addItems: (items: AddItem[], label: string) => Promise<boolean>
}

const StoreUIContext = createContext<StoreUI | null>(null)

const readWish = (): string[] => {
  try {
    const raw = window.localStorage.getItem(WISH_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function StoreUIProvider({ children }: { children: React.ReactNode }) {
  const { countryCode } = useParams() as { countryCode: string }
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [toastShown, setToastShown] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])

  useEffect(() => {
    setWishlist(readWish())
  }, [])

  const toast = useCallback((message: string) => {
    setToastMsg(message)
    setToastShown(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastShown(false), 2600)
  }, [])

  const toggleWish = useCallback(
    (productId: string) => {
      const items = readWish()
      const i = items.indexOf(productId)
      if (i > -1) {
        items.splice(i, 1)
        toast("Removed from wishlist")
      } else {
        items.push(productId)
        toast("Saved to wishlist")
      }
      try {
        window.localStorage.setItem(WISH_KEY, JSON.stringify(items))
      } catch {
        // Private mode / blocked storage: the heart still toggles for this visit.
      }
      setWishlist([...items])
    },
    [toast]
  )

  const addItems = useCallback(
    async (items: AddItem[], label: string) => {
      try {
        // Sequential on purpose: parallel adds race on the cart-id cookie when
        // the visitor has no cart yet and each call would create its own.
        for (const item of items) {
          await addToCart({
            variantId: item.variantId,
            quantity: item.quantity ?? 1,
            countryCode,
          })
        }
        setCartOpen(true)
        toast(`${label} added to cart`)
        return true
      } catch {
        toast("Couldn't add that to your cart — please try again")
        return false
      }
    },
    [countryCode, toast]
  )

  // Esc closes whichever overlay is open, and overlays lock page scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false)
        setMenuOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  useEffect(() => {
    document.body.style.overflow = cartOpen || menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [cartOpen, menuOpen])

  const value: StoreUI = {
    toast,
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    menuOpen,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
    wishlist,
    isWished: (id) => wishlist.includes(id),
    toggleWish,
    addItems,
  }

  return (
    <StoreUIContext.Provider value={value}>
      {children}
      <div className={`toast${toastShown ? " show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </StoreUIContext.Provider>
  )
}

export function useStoreUI() {
  const ctx = useContext(StoreUIContext)
  if (!ctx) {
    throw new Error("useStoreUI must be used inside <StoreUIProvider>")
  }
  return ctx
}
