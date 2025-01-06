"use client"

import { placeOrder } from "@lib/data/cart"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const PaymentProcessingPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handlePaymentResult = async () => {
      const status_id = searchParams.get("status_id")
      const order_id = searchParams.get("order_id")
      const transaction_id = searchParams.get("transaction_id")
      const msg = searchParams.get("msg")
      const hash = searchParams.get("hash")
      const amount = searchParams.get("amount")
      const name = searchParams.get("name")
      const email = searchParams.get("email")
      const phone = searchParams.get("phone")
      const type = searchParams.get("type")

      // Validate required parameters
      if (!status_id || !order_id) {
        console.error("Missing required parameters from SenangPay return URL")
        router.push("/checkout?status=error")
        return
      }

      try {
        // Call webhook endpoint through our API route
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
          }/webhooks/senangpay?${new URLSearchParams({
            status_id,
            order_id,
            transaction_id: transaction_id || "",
            msg: msg || "",
            hash: hash || "",
            amount: amount || "",
            name: name || "",
            email: email || "",
            phone: phone || "",
            type: type || "",
          })}`
        )

        if (!response.ok) {
          throw new Error("Failed to process webhook")
        }

        const webhookResult = await response.json()

        // If webhook action is captured, place the order
        if (webhookResult.action === "captured") {
          try {
            const order = await placeOrder()
            router.push(`/order/confirmed/${order.id}`)
          } catch (error) {
            console.error("Error completing order:", error)
            router.push("/checkout?status=error")
          }
        } else {
          // Payment failed or pending
          const errorMessage = msg || "Payment was not successful"
          router.push(
            `/checkout?status=failed&message=${encodeURIComponent(
              errorMessage
            )}`
          )
        }
      } catch (error) {
        console.error("Error processing payment:", error)
        router.push("/checkout?status=error")
      }
    }

    handlePaymentResult()
  }, [router, searchParams])

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <svg
        className="animate-spin h-8 w-8 text-gray-900"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="text-gray-700 mt-4">Processing your payment...</p>
    </div>
  )
}

export default PaymentProcessingPage
