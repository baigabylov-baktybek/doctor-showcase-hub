import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchDoctors, doctorPhotoUrl, uploadDoctorPhoto, type Doctor } from "@/lib/doctors";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, LogOut, ArrowLeft, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: doctors = [], isLoading } = useQuery({ queryKey: ["doctors"], queryFn: fetchDoctors });
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) return <div className="grid min-h-screen place-items-center text-muted-foreground">Загрузка...</div>;

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl">Нет доступа</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            У вашего аккаунта нет роли администратора. Первый зарегистрированный пользователь автоматически становится администратором.
          </p>
          <Button className="mt-6" onClick={() => supabase.auth.signOut()}>Выйти</Button>
        </Card>
      </div>
    );
  }

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (d: Doctor) => { setEditing(d); setOpen(true); };
  const onDelete = async (d: Doctor) => {
    if (!confirm(`Удалить врача "${d.name}"?`)) return;
    const { error } = await supabase.from("doctors").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["doctors"] });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold">Меридиан · Админ</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />На сайт</Button></Link>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="mr-2 h-4 w-4" />Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl">Врачи</h1>
            <p className="mt-1 text-sm text-muted-foreground">Управление списком врачей клиники</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Добавить врача</Button>
            </DialogTrigger>
            <DoctorFormDialog doctor={editing} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["doctors"] }); }} />
          </Dialog>
        </div>

        <div className="mt-8 grid gap-4">
          {isLoading ? (
            <div className="text-muted-foreground">Загрузка...</div>
          ) : doctors.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">Пока нет врачей. Добавьте первого!</Card>
          ) : (
            doctors.map((d) => {
              const url = doctorPhotoUrl(d.photo_url);
              return (
                <Card key={d.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {url ? <img src={url} alt={d.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-sm text-primary">{d.specialty}</div>
                    {d.bio ? <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">{d.bio}</div> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">#{d.order_index}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => onDelete(d)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function DoctorFormDialog({ doctor, onDone }: { doctor: Doctor | null; onDone: () => void }) {
  const [name, setName] = useState(doctor?.name ?? "");
  const [specialty, setSpecialty] = useState(doctor?.specialty ?? "");
  const [bio, setBio] = useState(doctor?.bio ?? "");
  const [orderIndex, setOrderIndex] = useState(doctor?.order_index ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(doctor?.name ?? "");
    setSpecialty(doctor?.specialty ?? "");
    setBio(doctor?.bio ?? "");
    setOrderIndex(doctor?.order_index ?? 0);
    setFile(null);
  }, [doctor]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photo_url = doctor?.photo_url ?? null;
      if (file) photo_url = await uploadDoctorPhoto(file);

      const payload = { name, specialty, bio: bio || null, photo_url, order_index: orderIndex };

      if (doctor) {
        const { error } = await supabase.from("doctors").update(payload).eq("id", doctor.id);
        if (error) throw error;
        toast.success("Обновлено");
      } else {
        const { error } = await supabase.from("doctors").insert(payload);
        if (error) throw error;
        toast.success("Добавлено");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const preview = file ? URL.createObjectURL(file) : doctorPhotoUrl(doctor?.photo_url ?? null);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{doctor ? "Редактировать врача" : "Новый врач"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="flex-1">
            <Label htmlFor="photo">Фото</Label>
            <Input id="photo" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty">Специальность</Label>
          <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Описание</Label>
          <Textarea id="bio" value={bio ?? ""} onChange={(e) => setBio(e.target.value)} rows={4} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Порядок отображения</Label>
          <Input id="order" type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
