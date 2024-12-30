"use client"

import { useEffect, useState } from "react"
import CartDropdown from "../cart-dropdown"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

export default function CartButton() {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)

  useEffect(() => {
    const fetchCart = async () => {
      const cart = await retrieveCart()
      if (!cart) return

      if (cart?.items?.length) {
        const enrichedItems = await enrichLineItems(cart.items, cart.region_id!)
        cart.items = enrichedItems
      }
      setCart(cart)
    }

    fetchCart()
  }, [])

  return <CartDropdown cart={cart} />
}
