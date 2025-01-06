"use client"

import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

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
  const searchParams = useSearchParams()
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id.includes("senangpay") && s.status === "pending"
  )

  // Handle return from Senangpay
  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success") {
      // Complete the order
      placeOrder().catch((err) => {
        setErrorMessage(err.message)
        setSubmitting(false)
      })
    } else if (status === "failed" || status === "error") {
      setErrorMessage("Payment failed. Please try again.")
      setSubmitting(false)
    }
  }, [searchParams])

  const detail = cart?.items
    ?.map(({ product_title, variant }) => `${product_title} ${variant?.title}`)
    .join(" ,")

  const handlePayment = async () => {
    setSubmitting(true)

    if (!session?.data) {
      console.error("[SenangPay Button] No session data available")
      setSubmitting(false)
      return
    }

    const form = document.createElement("form")
    form.method = "POST"
    form.action = session.data.payment_url as string

    // Get the current URL to construct return URL
    // const returnUrl = `${window.location.origin}/api/webhooks/senangpay/return`

    const fields = {
      detail: session.data.detail as string,
      amount: session.data.amount as string,
      order_id: session.data.order_id as string,
      hash: session.data.hash as string,
      name: session.data.name as string,
      email: session.data.email as string,
      phone: session.data.phone as string,
      // return_url: returnUrl,
    }

    console.log("[SenangPay Button] Payment URL:", form.action)
    console.log("[SenangPay Button] Form fields:", fields)

    Object.entries(fields).forEach(([key, value]) => {
      if (value) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = value
        form.appendChild(input)
      }
    })

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  return (
    <>
      <Button
        disabled={notReady || submitting}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
      >
        Place order
      </Button>
      {errorMessage && <div className="text-red-500 mt-2">{errorMessage}</div>}
    </>
  )
}

export default SenangPayPaymentButton
