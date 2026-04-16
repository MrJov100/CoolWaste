"use client";

import { useEffect, useId, useState } from "react";
import { Crosshair, ExternalLink, LoaderCircle, MapPinned, MoveHorizontal, MoveVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsUrl } from "@/lib/maps";

type PickerProps = {
  title: string;
  description: string;
  latitudeName?: string;
  longitudeName?: string;
  addressName?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string | null;
  addressLabel?: string;
};

const MOVE_STEP = 0.0005;

export function PickupLocationPicker({
  title,
  description,
  latitudeName = "latitude",
  longitudeName = "longitude",
  addressName = "address",
  initialLatitude,
  initialLongitude,
  initialAddress,
  addressLabel = "Alamat",
}: PickerProps) {
  const addressInputId = useId();
  const latitudeInputId = useId();
  const longitudeInputId = useId();
  const [latitude, setLatitude] = useState<string>(initialLatitude?.toFixed(6) ?? "");
  const [longitude, setLongitude] = useState<string>(initialLongitude?.toFixed(6) ?? "");
  const [address, setAddress] = useState<string>(initialAddress ?? "");
  const [status, setStatus] = useState<string>("Belum ada titik lokasi yang dipilih.");
  const [isLoading, setIsLoading] = useState(false);

  const numericLatitude = latitude ? Number(latitude) : null;
  const numericLongitude = longitude ? Number(longitude) : null;
  const hasPoint = Number.isFinite(numericLatitude) && Number.isFinite(numericLongitude);
  const mapsUrl = hasPoint ? buildGoogleMapsUrl(numericLatitude, numericLongitude) : null;
  const mapsEmbedUrl = hasPoint ? buildGoogleMapsEmbedUrl(numericLatitude, numericLongitude) : null;

  useEffect(() => {
    if (initialLatitude != null && initialLongitude != null) {
      setStatus("Titik lokasi tersimpan siap diubah kapan saja.");
    }
  }, [initialLatitude, initialLongitude]);

  async function reverseGeocode(nextLatitude: string, nextLongitude: string) {
    try {
      const response = await fetch(`/api/geocode/reverse?lat=${nextLatitude}&lng=${nextLongitude}`, {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Alamat tidak ditemukan.");
      }

      const displayName = payload.data?.displayName ?? "";
      if (displayName) {
        setAddress(displayName);
        setStatus("Titik Google Maps diperbarui dan alamat diisi otomatis.");
        return;
      }

      setStatus("Titik berhasil diperbarui, tetapi alamat otomatis belum tersedia.");
    } catch {
      setStatus("Titik berhasil diperbarui, tetapi alamat otomatis gagal dimuat.");
    }
  }

  function updateCoordinates(nextLatitude: number, nextLongitude: number) {
    const lat = nextLatitude.toFixed(6);
    const lng = nextLongitude.toFixed(6);
    setLatitude(lat);
    setLongitude(lng);
    setStatus("Titik lokasi digeser. Simpan jika sudah sesuai.");
    void reverseGeocode(lat, lng);
  }

  function movePoint(latDelta: number, lngDelta: number) {
    if (!hasPoint || numericLatitude == null || numericLongitude == null) {
      setStatus("Tentukan titik awal terlebih dulu sebelum menggeser pin.");
      return;
    }

    updateCoordinates(numericLatitude + latDelta, numericLongitude + lngDelta);
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Browser ini tidak mendukung geolocation.");
      return;
    }

    setIsLoading(true);
    setStatus("Mengambil titik lokasi dari perangkat...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude.toFixed(6);
        const nextLongitude = position.coords.longitude.toFixed(6);

        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        void reverseGeocode(nextLatitude, nextLongitude).finally(() => {
          setIsLoading(false);
        });
      },
      (error) => {
        setStatus(`Gagal mengambil lokasi: ${error.message}`);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isLoading}>
          {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
          {isLoading ? "Mengambil..." : "Gunakan lokasi saya"}
        </Button>
      </div>

      <input type="hidden" name={latitudeName} value={latitude} />
      <input type="hidden" name={longitudeName} value={longitude} />

      <div className="space-y-2">
        <Label htmlFor={addressInputId}>{addressLabel}</Label>
        <Input
          id={addressInputId}
          name={addressName}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Alamat akan terisi otomatis dari titik Google Maps"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <Button type="button" variant="ghost" onClick={() => movePoint(MOVE_STEP, 0)}>
          <MoveVertical className="mr-2 h-4 w-4" />
          Geser utara
        </Button>
        <Button type="button" variant="ghost" onClick={() => movePoint(-MOVE_STEP, 0)}>
          <MoveVertical className="mr-2 h-4 w-4" />
          Geser selatan
        </Button>
        <Button type="button" variant="ghost" onClick={() => movePoint(0, -MOVE_STEP)}>
          <MoveHorizontal className="mr-2 h-4 w-4" />
          Geser barat
        </Button>
        <Button type="button" variant="ghost" onClick={() => movePoint(0, MOVE_STEP)}>
          <MoveHorizontal className="mr-2 h-4 w-4" />
          Geser timur
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
        <div className="flex items-start gap-3">
          <MapPinned className="mt-0.5 h-4 w-4 text-emerald-300" />
          <div className="space-y-2">
            <p>{status}</p>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200"
              >
                Buka titik di Google Maps
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {mapsEmbedUrl ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60">
          <iframe
            title="Google Maps preview"
            src={mapsEmbedUrl}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  );
}
