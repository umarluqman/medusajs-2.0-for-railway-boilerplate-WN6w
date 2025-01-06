import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // Forward the request to the backend
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      }/webhooks/senangpay?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to process webhook")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
