"use client";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, User, MapPin, Phone, Mail, CheckCircle2, XCircle, Bell } from "lucide-react";
import { differenceInMinutes } from "date-fns";

type VisitEntry = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  party_size: number | null;
  seating_preference: string | null;
  status: string;
  created_at: string;
  notified_at: string | null;
  waitlist_id?: string | null;
  sms_status?: string | null;
  whatsapp_status?: string | null;
  send_sms?: boolean | null;
  send_whatsapp?: boolean | null;
};

function getWaitTime(createdAt: string, notifiedAt: string | null) {
  const start = new Date(createdAt);
  const end = notifiedAt ? new Date(notifiedAt) : new Date();
  const totalMinutes = differenceInMinutes(end, start);

  if (totalMinutes < 1) return "< 1 minute";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

  return parts.join(', ');
}

function getStatusDisplay(status: string, notifiedAt: string | null) {
  if (status === "seated") {
    return { label: "Showed", color: "text-emerald-600", bgColor: "bg-emerald-50" };
  }
  if (status === "cancelled") {
    return { label: "Cancelled", color: "text-gray-600", bgColor: "bg-gray-50" };
  }
  if (status === "archived") {
    if (notifiedAt) {
      return { label: "No Show", color: "text-red-600", bgColor: "bg-red-50" };
    }
    return { label: "Archived", color: "text-gray-600", bgColor: "bg-gray-50" };
  }
  if (status === "notified") {
    return { label: "Called", color: "text-blue-600", bgColor: "bg-blue-50" };
  }
  return { label: "Waiting", color: "text-yellow-600", bgColor: "bg-yellow-50" };
}

export default function VisitDetailModal({
  visit,
  open,
  onOpenChange,
}: {
  visit: VisitEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!visit) return null;

  const statusDisplay = getStatusDisplay(visit.status, visit.notified_at);
  const waitTime = getWaitTime(visit.created_at, visit.notified_at);

  // Build timeline events
  const timelineEvents = [
    {
      icon: User,
      label: "Joined waitlist",
      time: new Date(visit.created_at).toLocaleString(),
      completed: true,
    },
  ];

  if (visit.notified_at) {
    timelineEvents.push({
      icon: Bell,
      label: "Called",
      time: new Date(visit.notified_at).toLocaleString(),
      completed: true,
    });
  }

  if (visit.status === "seated") {
    timelineEvents.push({
      icon: CheckCircle2,
      label: "Checked in",
      time: new Date(visit.notified_at || visit.created_at).toLocaleString(),
      completed: true,
    });
  } else if (visit.status === "archived" && visit.notified_at) {
    timelineEvents.push({
      icon: XCircle,
      label: "Marked as no-show",
      time: "—",
      completed: true,
    });
  } else if (visit.status === "cancelled") {
    timelineEvents.push({
      icon: XCircle,
      label: "Cancelled",
      time: "—",
      completed: true,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex max-h-[90vh] flex-col">
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle>Visit Details</DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-6">
          {/* Customer Info Header */}
          <div className={`rounded-lg p-4 ${statusDisplay.bgColor}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {visit.customer_name || "Anonymous Customer"}
                </h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {visit.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{visit.phone}</span>
                    </div>
                  )}
                  {visit.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{visit.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge className={`${statusDisplay.color} bg-transparent border-0`}>
                {statusDisplay.label}
              </Badge>
            </div>
          </div>

          {/* Visit Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Party Size
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {visit.party_size || "—"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Wait Time
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{waitTime}</span>
              </div>
            </div>

            {visit.seating_preference && (
              <div className="space-y-1 col-span-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  Seating Preference
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{visit.seating_preference}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Activity Timeline
            </h4>
            <div className="space-y-3">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          rounded-full p-1.5 ring-1 ring-orange-200 bg-transparent
                          ${event.completed ? "text-orange-500" : "text-orange-500/70"}
                        `}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {index < timelineEvents.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="text-sm font-medium">{event.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {event.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notification Status */}
          {(visit.send_sms || visit.send_whatsapp) && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              <h4 className="text-sm font-semibold">Notifications</h4>
              <div className="space-y-1 text-sm">
                {visit.send_sms && (
                  <div className="flex items-center justify-between">
                    <span>SMS</span>
                    <Badge variant="secondary" className="text-xs">
                      {visit.sms_status || "pending"}
                    </Badge>
                  </div>
                )}
                {visit.send_whatsapp && (
                  <div className="flex items-center justify-between">
                    <span>WhatsApp</span>
                    <Badge variant="secondary" className="text-xs">
                      {visit.whatsapp_status || "pending"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
