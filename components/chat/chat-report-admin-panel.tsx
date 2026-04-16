import { format } from "date-fns";

import { resolveChatReport } from "@/lib/actions/chat";
import type { ChatReportEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ChatReportAdminPanel({ reports }: { reports: ChatReportEntry[] }) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardDescription>Laporan chat dari user dan collector yang perlu ditinjau admin.</CardDescription>
        <CardTitle>Laporan Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.length ? (
          reports.map((report) => (
            <div key={report.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{report.pickupRequestNo}</p>
                  <h3 className="text-lg font-semibold text-white">
                    {report.reportedByName} melaporkan {report.reportedUserName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{report.reason}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{report.status}</p>
                  <p>{format(report.createdAt, "dd MMM yyyy, HH:mm")}</p>
                </div>
              </div>

              {report.messageContent ? (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-100">
                  Pesan yang dilaporkan: {report.messageContent}
                </div>
              ) : null}

              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                {report.transcript.map((message) => (
                  <div key={message.id} className="text-sm text-slate-300">
                    <span className="font-medium text-white">{message.senderName}</span>: {message.content}
                  </div>
                ))}
              </div>

              <form action={resolveChatReport.bind(null, report.id)} className="mt-4 flex flex-col gap-3 lg:flex-row">
                <Select name="status" defaultValue={report.status === "OPEN" ? "REVIEWED" : report.status}>
                  <option value="REVIEWED">Reviewed</option>
                  <option value="RESOLVED">Resolved</option>
                </Select>
                <Input
                  name="decision"
                  defaultValue={report.adminDecision ?? ""}
                  placeholder="Catatan / keputusan admin"
                />
                <Button type="submit" variant="outline">Simpan Keputusan</Button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">Belum ada laporan chat.</p>
        )}
      </CardContent>
    </Card>
  );
}
