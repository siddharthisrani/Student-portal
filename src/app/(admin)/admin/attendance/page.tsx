import { Metadata } from "next";

import AdminAttendanceClient from "@/components/admin/AdminAttendanceClient";
import AttendanceCalendarManager from "@/components/admin/AttendanceCalendarManager";

export const metadata: Metadata = {
  title: "Attendance | DNDC Admin",
};

export default function AdminAttendancePage() {
  return (
    <div>
      <AdminAttendanceClient />

      <div className="px-4 pb-6 sm:px-6">
        <AttendanceCalendarManager />
      </div>
    </div>
  );
}