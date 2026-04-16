import { Search } from "lucide-react";

import { PICKUP_STATUS_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function TransactionFilters({
  selectedType,
  query,
}: {
  selectedType?: string;
  query?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="type">Tipe transaksi</Label>
            <Select id="type" name="type" defaultValue={selectedType ?? ""}>
              <option value="">Semua</option>
              <option value="INCOME">Income</option>
              <option value="BONUS">Bonus</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="query">Cari deskripsi / user / collector</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input id="query" name="query" defaultValue={query} placeholder="Contoh: pickup atau andika" className="pl-10" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Terapkan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PickupFilters({ selectedStatus }: { selectedStatus?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="status">Status pickup</Label>
            <Select id="status" name="status" defaultValue={selectedStatus ?? ""}>
              <option value="">Semua</option>
              {Object.entries(PICKUP_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">Filter</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
