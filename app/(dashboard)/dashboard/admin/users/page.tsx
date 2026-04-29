import { Role, VerificationState } from "@prisma/client";
import { format } from "date-fns";
import { CheckCircle2, ShieldCheck, ShieldX, Users, XCircle } from "lucide-react";

import { AdminTopbar } from "@/components/layout/admin-topbar";
import { DeleteUserForm } from "./delete-user-form";
import { blockUser, rejectCollector, unblockUser } from "@/lib/actions/admin";
import { verifyCollector } from "@/lib/actions/dashboard";
import { requireRole } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminUsersPage() {
  const profile = await requireRole(Role.ADMIN);
  const { users, collectors } = await getAdminUsers();

  const blockedUsers = users.filter((u) => u.verificationState === VerificationState.REJECTED).length;
  const pendingCollectors = collectors.filter((c) => c.verificationState === VerificationState.PENDING).length;
  const verifiedCollectors = collectors.filter((c) => c.verificationState === VerificationState.VERIFIED).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminTopbar profile={profile} />

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-8 space-y-2">
          <Badge variant="emerald" className="w-fit">Manajemen Akun</Badge>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Manajemen Pengguna
          </h1>
          <p className="text-slate-400">
            Kelola akun user dan collector — verifikasi, blokir, dan pantau aktivitas.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total User", value: users.length, color: "text-blue-400" },
            { label: "Total Collector", value: collectors.length, color: "text-purple-400" },
            { label: "Collector Pending", value: pendingCollectors, color: "text-amber-400" },
            { label: "Akun Diblokir", value: blockedUsers, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-xs text-slate-400">{label}</p>
                <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Collectors section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">
              Collector ({collectors.length}) · Terverifikasi: {verifiedCollectors} · Pending: {pendingCollectors}
            </h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 font-medium text-slate-400">Nama</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Area</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Status</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Pickup Selesai</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Rating</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Melaporkan</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Dilaporkan</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Bergabung</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {collectors.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {c.serviceAreaLabel ?? <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {c.verificationState === VerificationState.VERIFIED && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
                            </span>
                          )}
                          {c.verificationState === VerificationState.PENDING && (
                            <span className="flex items-center gap-1 text-xs text-amber-400">
                              ⏳ Pending
                            </span>
                          )}
                          {c.verificationState === VerificationState.REJECTED && (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="h-3.5 w-3.5" /> Ditolak/Diblokir
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-300">{c.completedPickups}</td>
                        <td className="px-4 py-4 text-slate-300">
                          {c.ratingCount > 0
                            ? `${c.ratingAverage.toFixed(1)}/5 (${c.ratingCount})`
                            : "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className={c.reportsFiled > 0 ? "text-amber-400" : "text-slate-500"}>
                            {c.reportsFiled}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={c.reportsReceived > 0 ? "text-red-400" : "text-slate-500"}>
                            {c.reportsReceived}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">
                          {format(c.createdAt, "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            {c.verificationState === VerificationState.PENDING && (
                              <>
                                <form action={verifyCollector.bind(null, c.id)}>
                                  <Button type="submit" size="sm" className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                                    <ShieldCheck className="h-3.5 w-3.5" /> Verifikasi
                                  </Button>
                                </form>
                                <form action={rejectCollector.bind(null, c.id)}>
                                  <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs">
                                    <ShieldX className="h-3.5 w-3.5" /> Tolak
                                  </Button>
                                </form>
                              </>
                            )}
                            {c.verificationState === VerificationState.VERIFIED && (
                              <form action={blockUser.bind(null, c.id)}>
                                <input type="hidden" name="reason" value="Pelanggaran ketentuan layanan collector" />
                                <input type="hidden" name="durationDays" value="7" />
                                <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs">
                                  <ShieldX className="h-3.5 w-3.5" /> Blokir
                                </Button>
                              </form>
                            )}
                            {c.verificationState === VerificationState.REJECTED && (
                              <form action={unblockUser.bind(null, c.id)}>
                                <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Aktifkan
                                </Button>
                              </form>
                            )}
                            <DeleteUserForm userId={c.id} userName={c.name} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Users section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              Pengguna ({users.length}) · Diblokir: {blockedUsers}
            </h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-6 py-4 font-medium text-slate-400">Nama</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Status</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Pickup Selesai</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Total Berat</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Total Pemasukan</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Melaporkan</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Dilaporkan</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Bergabung</th>
                      <th className="px-4 py-4 font-medium text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {u.verificationState === VerificationState.REJECTED ? (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="h-3.5 w-3.5" /> Diblokir
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-300">{u.completedPickups}</td>
                        <td className="px-4 py-4 text-slate-300">{u.totalWeight.toFixed(1)} kg</td>
                        <td className="px-4 py-4 text-emerald-400">{formatCurrency(u.totalIncome)}</td>
                        <td className="px-4 py-4">
                          <span className={u.reportsFiled > 0 ? "text-amber-400" : "text-slate-500"}>
                            {u.reportsFiled}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={u.reportsReceived > 0 ? "text-red-400" : "text-slate-500"}>
                            {u.reportsReceived}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">
                          {format(u.createdAt, "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            {u.verificationState === VerificationState.REJECTED ? (
                              <form action={unblockUser.bind(null, u.id)}>
                                <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Aktifkan
                                </Button>
                              </form>
                            ) : (
                              <form action={blockUser.bind(null, u.id)}>
                                <input type="hidden" name="reason" value="Pelanggaran ketentuan layanan" />
                                <input type="hidden" name="durationDays" value="7" />
                                <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs">
                                  <ShieldX className="h-3.5 w-3.5" /> Blokir
                                </Button>
                              </form>
                            )}
                            <DeleteUserForm userId={u.id} userName={u.name} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
