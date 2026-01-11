'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive updates on job status and approvals.
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Show Overdue Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Highlight overdue jobs on dashboards.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium">Compact Tables</Label>
              <p className="text-xs text-muted-foreground">
                Use tighter spacing in list views.
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
