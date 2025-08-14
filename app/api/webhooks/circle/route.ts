import { type NextRequest, NextResponse } from "next/server"

// Circle requires HEAD method support for webhook verification
export async function HEAD() {
  console.log("Circle webhook HEAD request received")
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log("Circle webhook POST request received")

    // Get request body
    const body = await request.text()
    console.log("Webhook body:", body)

    // Get headers for logging
    const signature = request.headers.get("x-circle-signature")
    const keyId = request.headers.get("x-circle-key-id")
    const contentType = request.headers.get("content-type")

    console.log("Request headers:", {
      signature: signature ? "present" : "missing",
      keyId: keyId ? "present" : "missing",
      contentType,
      userAgent: request.headers.get("user-agent"),
    })

    // Parse payload if possible
    let payload
    try {
      payload = JSON.parse(body)
      console.log("Circle webhook payload:", payload)
    } catch (parseError) {
      console.log("Non-JSON payload received:", body)
    }

    const processingTime = Date.now() - startTime
    console.log(`Webhook processed in ${processingTime}ms`)

    // Always return 200 success
    return NextResponse.json(
      {
        received: true,
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Webhook error:", error)

    // Still return 200 to prevent Circle from retrying
    return NextResponse.json(
      {
        received: true,
        error: "Processing failed but acknowledged",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export async function GET() {
  console.log("Circle webhook GET request received")
  return NextResponse.json(
    {
      status: "Circle webhook endpoint active",
      timestamp: new Date().toISOString(),
      endpoint: "/api/webhooks/circle",
      methods: ["POST", "GET", "OPTIONS", "HEAD"],
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export async function OPTIONS() {
  console.log("Circle webhook OPTIONS request received")
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "Content-Type, x-circle-signature, x-circle-key-id",
    },
  })
}
