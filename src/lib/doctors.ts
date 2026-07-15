import { supabase } from "@/integrations/supabase/client";

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  photo_url: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export async function fetchDoctors(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Doctor[];
}

export function doctorPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("doctors").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadDoctorPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("doctors").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
