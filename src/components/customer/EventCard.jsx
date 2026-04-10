import React from "react";
import { Card } from "@/components/ui/card";
import { CalendarDays, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function EventCard({ event }) {
  const { getLocalizedField } = useI18n();
  const title = getLocalizedField(event, "title");
  const desc = getLocalizedField(event, "description");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        {event.image_url && (
          <div className="aspect-video overflow-hidden bg-muted">
            <img
              src={event.image_url}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {desc && (
            <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {event.date ? format(new Date(event.date), "MMM d, yyyy") : ""}
            </span>
            {event.time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {event.time}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
