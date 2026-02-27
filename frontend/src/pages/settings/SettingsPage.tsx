import { useAuthStore } from "../../store/authStore";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { User, Bell, Lock, Save } from "lucide-react";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: "Settings" }]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account preferences.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Profile Information
              </div>
            </CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={user?.name || ""} size="lg" />
            <div>
              <Button variant="outline" size="sm">
                Change photo
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 2MB</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              defaultValue={user?.name}
              className="sm:col-span-2"
            />
            <Input
              label="Email"
              type="email"
              defaultValue={user?.email}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button icon={<Save className="h-4 w-4" />}>Save Changes</Button>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                Notification Preferences
              </div>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {[
              {
                label: "Email notifications for claim updates",
                key: "claimUpdates",
              },
              {
                label: "Email notifications for new assignments",
                key: "assignments",
              },
              { label: "Browser push notifications", key: "push" },
              { label: "Weekly summary digest", key: "digest" },
            ].map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between py-2 cursor-pointer"
              >
                <span className="text-sm text-gray-300">{pref.label}</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500/20 h-4 w-4"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-500" />
                Security
              </div>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              hint="Must be at least 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="secondary" icon={<Lock className="h-4 w-4" />}>
              Update Password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
