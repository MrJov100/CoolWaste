"use server";

import { Role, VerificationState, WasteType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile, requireRole } from "@/lib/auth";
import { getDefaultWastePricingMap } from "@/lib/constants";
import { db } from "@/lib/db";

type ActionState = {
  success: boolean;
  message: string;
};

const userSettingsSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter."),
  address: z.string().trim().min(8, "Alamat utama minimal 8 karakter."),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

const savedAddressSchema = z.object({
  label: z.string().trim().min(2, "Label alamat minimal 2 karakter."),
  address: z.string().trim().min(8, "Alamat minimal 8 karakter."),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isDefault: z.boolean().optional(),
});

const collectorSettingsSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  phone: z.string().trim().min(8, "Nomor telepon minimal 8 karakter."),
  address: z.string().trim().min(5, "Alamat basis collector minimal 5 karakter."),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  serviceAreaLabel: z.string().trim().min(3, "Area layanan minimal 3 karakter."),
  serviceRadiusKm: z.coerce.number().positive("Radius layanan harus lebih dari 0."),
  dailyCapacityKg: z.coerce.number().positive("Kapasitas harian harus lebih dari 0."),
  acceptedWasteTypes: z.array(z.nativeEnum(WasteType)).min(1, "Pilih minimal satu jenis sampah."),
  plasticPrice: z.coerce.number().min(0, "Harga plastik tidak boleh negatif."),
  paperPrice: z.coerce.number().min(0, "Harga kertas tidak boleh negatif."),
  organicPrice: z.coerce.number().min(0, "Harga organik tidak boleh negatif."),
  metalPrice: z.coerce.number().min(0, "Harga logam tidak boleh negatif."),
  glassPrice: z.coerce.number().min(0, "Harga kaca tidak boleh negatif."),
}).superRefine((data, ctx) => {
  const mapping: Record<WasteType, number> = {
    [WasteType.PLASTIC]: data.plasticPrice,
    [WasteType.PAPER]: data.paperPrice,
    [WasteType.ORGANIC]: data.organicPrice,
    [WasteType.METAL]: data.metalPrice,
    [WasteType.GLASS]: data.glassPrice,
  };

  for (const type of data.acceptedWasteTypes) {
    if (mapping[type] === undefined || mapping[type] === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Harga untuk sampah jenis ${type} wajib diisi karena Anda menerimanya.`,
        path: [`${type.toLowerCase()}Price`],
      });
    }
  }
});

function normalizeOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function revalidateSettingsViews() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/user");
  revalidatePath("/dashboard/collector");
  revalidatePath("/dashboard/admin");
}

export async function updateUserSettings(_: ActionState, formData: FormData) {
  const profile = await requireRole(Role.USER);
  const parsed = userSettingsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    latitude: normalizeOptionalNumber(formData.get("latitude")),
    longitude: normalizeOptionalNumber(formData.get("longitude")),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Pengaturan user belum valid.",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        address: parsed.data.address,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      },
    });

    const defaultAddress = await tx.savedAddress.findFirst({
      where: {
        profileId: profile.id,
        isDefault: true,
      },
    });

    if (defaultAddress) {
      await tx.savedAddress.update({
        where: { id: defaultAddress.id },
        data: {
          label: defaultAddress.label || "Alamat utama",
          address: parsed.data.address,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
        },
      });
    } else {
      await tx.savedAddress.create({
        data: {
          profileId: profile.id,
          label: "Alamat utama",
          address: parsed.data.address,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          isDefault: true,
        },
      });
    }
  });

  revalidateSettingsViews();

  return {
    success: true,
    message: "Pengaturan user berhasil diperbarui.",
  };
}

export async function addSavedAddress(_: ActionState, formData: FormData) {
  const profile = await requireRole(Role.USER);
  const parsed = savedAddressSchema.safeParse({
    label: formData.get("label"),
    address: formData.get("address"),
    latitude: normalizeOptionalNumber(formData.get("latitude")),
    longitude: normalizeOptionalNumber(formData.get("longitude")),
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Alamat tambahan belum valid.",
    };
  }

  await db.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.savedAddress.updateMany({
        where: { profileId: profile.id },
        data: { isDefault: false },
      });

      await tx.profile.update({
        where: { id: profile.id },
        data: {
          address: parsed.data.address,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
        },
      });
    }

    await tx.savedAddress.create({
      data: {
        profileId: profile.id,
        label: parsed.data.label,
        address: parsed.data.address,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        isDefault: parsed.data.isDefault ?? false,
      },
    });
  });

  revalidateSettingsViews();

  return {
    success: true,
    message: "Alamat baru berhasil ditambahkan.",
  };
}

export async function setDefaultSavedAddress(addressId: string) {
  const profile = await requireRole(Role.USER);

  const address = await db.savedAddress.findFirstOrThrow({
    where: {
      id: addressId,
      profileId: profile.id,
    },
  });

  await db.$transaction([
    db.savedAddress.updateMany({
      where: { profileId: profile.id },
      data: { isDefault: false },
    }),
    db.savedAddress.update({
      where: { id: address.id },
      data: { isDefault: true },
    }),
    db.profile.update({
      where: { id: profile.id },
      data: {
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
      },
    }),
  ]);

  revalidateSettingsViews();
}

export async function deleteSavedAddress(addressId: string) {
  const profile = await requireRole(Role.USER);

  const address = await db.savedAddress.findFirstOrThrow({
    where: {
      id: addressId,
      profileId: profile.id,
    },
  });

  const addressCount = await db.savedAddress.count({
    where: { profileId: profile.id },
  });

  if (address.isDefault && addressCount === 1) {
    throw new Error("Alamat default terakhir tidak bisa dihapus.");
  }

  await db.$transaction(async (tx) => {
    await tx.savedAddress.delete({
      where: { id: address.id },
    });

    if (address.isDefault) {
      const nextDefault = await tx.savedAddress.findFirst({
        where: { profileId: profile.id },
        orderBy: { createdAt: "asc" },
      });

      if (nextDefault) {
        await tx.savedAddress.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });

        await tx.profile.update({
          where: { id: profile.id },
          data: {
            address: nextDefault.address,
            latitude: nextDefault.latitude,
            longitude: nextDefault.longitude,
          },
        });
      }
    }
  });

  revalidateSettingsViews();
}

export async function updateCollectorSettings(_: ActionState, formData: FormData) {
  const profile = await requireRole(Role.COLLECTOR);
  const acceptedWasteTypes = formData
    .getAll("acceptedWasteTypes")
    .filter((value): value is WasteType => typeof value === "string" && value in WasteType);


  const parsed = collectorSettingsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    latitude: normalizeOptionalNumber(formData.get("latitude")),
    longitude: normalizeOptionalNumber(formData.get("longitude")),
    serviceAreaLabel: formData.get("serviceAreaLabel"),
    serviceRadiusKm: formData.get("serviceRadiusKm"),
    dailyCapacityKg: formData.get("dailyCapacityKg"),
    acceptedWasteTypes,
    plasticPrice: formData.get("plasticPrice"),
    paperPrice: formData.get("paperPrice"),
    organicPrice: formData.get("organicPrice"),
    metalPrice: formData.get("metalPrice"),
    glassPrice: formData.get("glassPrice"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Pengaturan collector belum valid.",
    };
  }

  await db.profile.update({
    where: { id: profile.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      serviceAreaLabel: parsed.data.serviceAreaLabel,
      serviceRadiusKm: parsed.data.serviceRadiusKm,
      dailyCapacityKg: parsed.data.dailyCapacityKg,
      wastePricing: {
        PLASTIC: parsed.data.plasticPrice,
        PAPER: parsed.data.paperPrice,
        ORGANIC: parsed.data.organicPrice,
        METAL: parsed.data.metalPrice,
        GLASS: parsed.data.glassPrice,
      },
      acceptedWasteTypes: parsed.data.acceptedWasteTypes,
      verificationState:
        profile.verificationState === VerificationState.VERIFIED
          ? VerificationState.VERIFIED
          : VerificationState.PENDING,
    },
  });

  revalidateSettingsViews();

  return {
    success: true,
    message:
      profile.verificationState === VerificationState.VERIFIED
        ? "Pengaturan collector berhasil diperbarui."
        : "Pengaturan collector berhasil disimpan dan tetap menunggu verifikasi admin.",
  };
}

export async function getSettingsActorRole() {
  const profile = await requireProfile();
  return profile.role;
}
