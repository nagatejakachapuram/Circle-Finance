import crypto from "crypto"

const CIRCLE_IP_ALLOWLIST = ["54.243.112.156", "100.24.191.35", "54.165.52.248", "54.87.106.46"]

export interface CirclePublicKey {
  id: string
  algorithm: string
  publicKey: string
  createDate: string
}

export class CircleWebhookVerifier {
  private static publicKeyCache = new Map<string, CirclePublicKey>()

  static async getPublicKey(keyId: string): Promise<CirclePublicKey | null> {
    // Check cache first
    if (this.publicKeyCache.has(keyId)) {
      return this.publicKeyCache.get(keyId)!
    }

    try {
      const apiKey = process.env.CIRCLE_API_KEY
      if (!apiKey) {
        console.error("CIRCLE_API_KEY not configured")
        return null
      }

      const response = await fetch(`https://api.circle.com/v2/notifications/publicKey/${keyId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        console.error("Failed to fetch Circle public key:", response.status)
        return null
      }

      const data = await response.json()
      const publicKey = data.data

      // Cache the public key
      this.publicKeyCache.set(keyId, publicKey)
      return publicKey
    } catch (error) {
      console.error("Error fetching Circle public key:", error)
      return null
    }
  }

  static async verifySignature(payload: string, signature: string, keyId: string): Promise<boolean> {
    try {
      const publicKeyData = await this.getPublicKey(keyId)
      if (!publicKeyData) {
        return false
      }

      // Decode the public key from base64
      const publicKeyBuffer = Buffer.from(publicKeyData.publicKey, "base64")

      // Create public key object
      const publicKey = crypto.createPublicKey({
        key: publicKeyBuffer,
        format: "der",
        type: "spki",
      })

      // Decode signature from base64
      const signatureBuffer = Buffer.from(signature, "base64")

      // Verify signature using ECDSA with SHA256
      const verify = crypto.createVerify("SHA256")
      verify.update(payload, "utf8")

      return verify.verify(publicKey, signatureBuffer)
    } catch (error) {
      console.error("Signature verification error:", error)
      return false
    }
  }

  static isValidCircleIP(ip: string): boolean {
    return CIRCLE_IP_ALLOWLIST.includes(ip)
  }

  static getClientIP(request: Request): string | null {
    // Check various headers for the real IP
    const headers = request.headers

    return (
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") ||
      headers.get("x-client-ip") ||
      null
    )
  }
}
