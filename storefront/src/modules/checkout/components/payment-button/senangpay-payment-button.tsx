"use client"

import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface SenangPayPaymentButtonProps {
  cart: HttpTypes.StoreCart
  notReady: boolean
}

const SenangPayPaymentButton = ({
  cart,
  notReady,
}: SenangPayPaymentButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id.includes("senangpay") && s.status === "pending"
  )

  const onPaymentCompleted = async () => {
    const order = await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
    console.log({ order })
  }

  useEffect(() => {
    console.log("[SenangPay Button] Cart:", {
      payment_sessions: cart.payment_collection?.payment_sessions,
      payment_collection: cart.payment_collection,
    })
    console.log("[SenangPay Button] Found session:", session)
  }, [cart, session])

  const detail = cart?.items
    ?.map(({ product_title, variant }) => `${product_title} ${variant?.title}`)
    .join(" ,")
  console.log({ detail, items: cart.items })
  const handlePayment = async () => {
    setSubmitting(true)
    await onPaymentCompleted()

    // if (!session?.data) {
    //   console.error("[SenangPay Button] No session data available")
    //   setSubmitting(false)
    //   return
    // }

    // const form = document.createElement("form")
    // form.method = "POST"
    // form.action = session.data.payment_url as string

    // const fields = {
    //   detail: session.data.detail as string,
    //   // detail: "sekut",
    //   amount: session.data.amount as string,
    //   order_id: session.data.order_id as string,
    //   hash: session.data.hash as string,
    //   name: session.data.name as string,
    //   email: session.data.email as string,
    //   phone: session.data.phone as string,
    // }

    // console.log("[SenangPay Button] Payment URL:", form.action)
    // console.log("[SenangPay Button] Form fields:", fields)

    // Object.entries(fields).forEach(([key, value]) => {
    //   if (value) {
    //     const input = document.createElement("input")
    //     input.type = "hidden"
    //     input.name = key
    //     input.value = value
    //     form.appendChild(input)
    //   }
    // })

    // document.body.appendChild(form)
    // form.submit()
    // document.body.removeChild(form)
  }

  return (
    <Button
      disabled={notReady || submitting}
      onClick={handlePayment}
      size="large"
      isLoading={submitting}
    >
      Pay with SenangPay
    </Button>
  )
}

export default SenangPayPaymentButton
