import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { doctorPhotoUrl, type Doctor } from "@/lib/doctors";

async function fetchDoctor(id: string): Promise<Doctor> {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as Doctor;
}

const doctorQuery = (id: string) =>
  queryOptions({
    queryKey: ["doctor", id],
    queryFn: () => fetchDoctor(id),
  });

export const Route = createFileRoute("/doctors/$id")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(doctorQuery(params.id)),
  component: DoctorPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Не удалось загрузить врача</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <Link to="/" className="mt-6 inline-block text-primary underline">На главную</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Врач не найден</h1>
      <Link to="/" className="mt-6 inline-block text-primary underline">Вернуться к списку</Link>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — ${loaderData.specialty} · Клиника Меридиан` },
          {
            name: "description",
            content: loaderData.bio?.slice(0, 160) ?? `${loaderData.name} — ${loaderData.specialty}`,
          },
        ]
      : [{ title: "Врач · Клиника Меридиан" }, { name: "robots", content: "noindex" }],
  }),
});

function DoctorPage() {
  const { id } = Route.useParams();
  const { data: doctor } = useSuspenseQuery(doctorQuery(id));
  const url = doctorPhotoUrl(doctor.photo_url);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Ко всем врачам
        </Link>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_1.2fr] md:gap-14">
          <div
            className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {url ? (
              <img src={url} alt={doctor.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <Stethoscope className="h-16 w-16" />
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-primary">
              {doctor.specialty}
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">{doctor.name}</h1>

            <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
              {doctor.bio ? (
                doctor.bio.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>Подробное описание врача скоро появится.</p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <a href="/#contact"><Button size="lg">Записаться на приём</Button></a>
              <Link to="/"><Button size="lg" variant="outline">Другие врачи</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
