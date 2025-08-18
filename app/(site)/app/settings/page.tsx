"use client"

import { useState } from "react"
import { useWallet } from "@/components/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Bell, Wallet, Globe, Sun, Smartphone, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const { address, disconnect } = useWallet()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    investment: true,
    security: true,
  })
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    portfolioVisible: false,
    activityVisible: true,
  })
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security settings</p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details and wallet connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-address">Connected Wallet</Label>
              <div className="flex items-center gap-2">
                <Input id="wallet-address" value={address || "Not connected"} readOnly className="font-mono text-sm" />
                <Badge variant={address ? "default" : "secondary"}>{address ? "Connected" : "Disconnected"}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <Input id="network" value="Polygon Amoy Testnet" readOnly className="text-sm" />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Wallet Connection</h4>
              <p className="text-sm text-muted-foreground">Manage your wallet connection</p>
            </div>
            <Button
              variant="outline"
              onClick={disconnect}
              disabled={!address}
              className="flex items-center gap-2 bg-transparent"
            >
              <Wallet className="w-4 h-4" />
              Disconnect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>Control your security preferences and data visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Profile Visibility</h4>
                <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
              </div>
              <Switch
                checked={privacy.profileVisible}
                onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, profileVisible: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Portfolio Visibility</h4>
                <p className="text-sm text-muted-foreground">Show your portfolio to other users</p>
              </div>
              <Switch
                checked={privacy.portfolioVisible}
                onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, portfolioVisible: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Activity Tracking</h4>
                <p className="text-sm text-muted-foreground">Allow activity tracking for analytics</p>
              </div>
              <Switch
                checked={privacy.activityVisible}
                onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, activityVisible: checked }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value="ck_live_51H8..."
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Your API key for programmatic access</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Get notified on your device</p>
                </div>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Security Alerts</h4>
                  <p className="text-sm text-muted-foreground">Important security notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.security}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, security: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Investment Updates</h4>
                  <p className="text-sm text-muted-foreground">Portfolio and market updates</p>
                </div>
              </div>
              <Switch
                checked={notifications.investment}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, investment: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" value="English (US)" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value="UTC-5 (Eastern Time)" readOnly />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">Toggle dark theme</p>
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
