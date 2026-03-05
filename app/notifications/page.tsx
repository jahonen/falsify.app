import NotificationsList from "../../src/components/Notifications/NotificationsList";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>
      <NotificationsList />
    </div>
  );
}
