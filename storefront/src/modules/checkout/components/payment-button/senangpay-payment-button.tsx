"use client"

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

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === "senangpay" && s.status === "pending"
  )

  useEffect(() => {
    console.log("[SenangPay Button] Cart:", {
      payment_sessions: cart.payment_collection?.payment_sessions,
      payment_collection: cart.payment_collection,
    })
    console.log("[SenangPay Button] Found session:", session)
  }, [cart, session])

  const handlePayment = () => {
    setSubmitting(true)
    console.log("[SenangPay Button] Handling payment with session:", {
      data: session?.data,
      provider_id: session?.provider_id,
      status: session?.status,
    })

    if (!session?.data) {
      console.error("[SenangPay Button] No session data available")
      setSubmitting(false)
      return
    }

    console.log("Session data for payment:", session.data)

    // const form = document.createElement("form")
    // form.method = "POST"
    // form.action = session.data.payment_url

    // const fields = {
    //   detail: session.data.detail,
    //   amount: session.data.amount,
    //   order_id: session.data.order_id,
    //   name: session.data.name,
    //   email: session.data.email,
    //   phone: session.data.phone,
    //   hash: session.data.hash,
    // }

    // console.log("[SenangPay Button] Submitting form with fields:", fields)

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
