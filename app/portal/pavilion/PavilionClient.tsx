"use client";

import { useState, useRef } from "react";
import PavilionCalendar, { type CalendarBooking } from "./PavilionCalendar";
import RequestForm from "./RequestForm";

/**
 * Holds the date shared between the calendar and the request form, so
 * "Request this day" fills in the form instead of making the resident
 * re-enter what they just clicked.
 */
export default function PavilionClient({
  bookings,
  today,
}: {
  bookings: CalendarBooking[];
  today: string;
}) {
  const [pickedDate, setPickedDate] = useState<string | undefined>();
  const formRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <PavilionCalendar
        bookings={bookings}
        today={today}
        onPickDate={(date) => {
          setPickedDate(date);
          formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <div ref={formRef}>
        <RequestForm today={today} prefillDate={pickedDate} />
      </div>
    </>
  );
}
