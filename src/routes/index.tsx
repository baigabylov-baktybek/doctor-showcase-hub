import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, HeartPulse, ShieldCheck, Clock, Phone, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchDoctors, doctorPhotoUrl } from "@/lib/doctors";
import heroImg from "@/assets/clinic-hero.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const services = [
  { icon: Stethoscope, title: "Терапия", desc: "Полная диагностика и лечение у опытных терапевтов." },
  { icon: HeartPulse, title: "Кардиология", desc: "Профилактика и лечение сердечно-сосудистых заболеваний." },
  { icon: ShieldCheck, title: "Диагностика", desc: "УЗИ, анализы, МРТ — точные результаты за один визит." },
  { icon: Clock, title: "24/7 поддержка", desc: "Экстренная помощь и консультации в любое время." },
];

function Landing() {
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold">Меридиан</span>
          </a>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#services" className="hover:text-foreground">Услуги</a>
            <a href="#doctors" className="hover:text-foreground">Врачи</a>
            <a href="#about" className="hover:text-foreground">О клинике</a>
            <a href="#contact" className="hover:text-foreground">Контакты</a>
          </nav>
          <Link to="/auth">
            <Button variant="outline" size="sm">Войти</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              Клиника нового поколения
            </span>
            <h1 className="mt-6 text-5xl leading-[1.05] md:text-6xl">
              Забота о здоровье, которой можно доверять
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Команда сертифицированных специалистов, современное оборудование и внимание к каждому пациенту.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact"><Button size="lg">Записаться на приём</Button></a>
              <a href="#doctors"><Button size="lg" variant="outline">Наши врачи</Button></a>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Интерьер клиники Меридиан"
              width={1600}
              height={1000}
              className="rounded-2xl object-cover"
              style={{ boxShadow: "var(--shadow-soft)" }}
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-4xl">Направления</h2>
          <p className="mt-3 text-muted-foreground">Полный спектр медицинских услуг под одной крышей.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Card key={s.title} className="p-6 transition-shadow hover:shadow-lg" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="border-t border-border/60 bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-4xl">Наши врачи</h2>
              <p className="mt-3 text-muted-foreground">Специалисты с многолетним опытом и искренним отношением.</p>
            </div>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-2xl bg-card" />
              ))
            ) : doctors.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                Пока не добавлено ни одного врача. Войдите в{" "}
                <Link to="/admin" className="text-primary underline">
                  админ-панель
                </Link>
                , чтобы добавить.
              </div>
            ) : (
              doctors.map((d) => {
                const url = doctorPhotoUrl(d.photo_url);
                return (
                  <article
                    key={d.id}
                    className="group overflow-hidden rounded-2xl bg-card"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-muted">
                      {url ? (
                        <img
                          src={url}
                          alt={d.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <Stethoscope className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="text-xs font-medium uppercase tracking-wider text-primary">
                        {d.specialty}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold">{d.name}</h3>
                      {d.bio ? (
                        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{d.bio}</p>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="text-4xl">О клинике</h2>
          <p className="mt-4 text-muted-foreground">
            Более 15 лет мы помогаем людям сохранять здоровье. В Меридиане собраны врачи высшей категории,
            современное оборудование и индивидуальный подход к каждому.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6">
            {[
              { n: "15+", l: "лет опыта" },
              { n: "40+", l: "врачей" },
              { n: "50k", l: "пациентов" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl text-primary">{s.n}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          className="rounded-2xl p-8 text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <h3 className="font-display text-2xl">Почему выбирают нас</h3>
          <ul className="mt-6 space-y-4 text-sm/relaxed">
            <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /> Международные стандарты качества</li>
            <li className="flex gap-3"><HeartPulse className="h-5 w-5 shrink-0" /> Индивидуальный план лечения</li>
            <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0" /> Запись без очередей</li>
            <li className="flex gap-3"><Stethoscope className="h-5 w-5 shrink-0" /> Полный цикл — от диагностики до реабилитации</li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-t border-border/60 bg-muted/40 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:grid-cols-3">
          <div>
            <h2 className="text-4xl">Контакты</h2>
            <p className="mt-3 text-muted-foreground">Свяжитесь с нами удобным способом.</p>
          </div>
          <Card className="p-6"><Phone className="h-5 w-5 text-primary" /><div className="mt-4 font-medium">+7 (495) 123-45-67</div><div className="text-sm text-muted-foreground">Ежедневно 8:00 — 22:00</div></Card>
          <Card className="p-6"><MapPin className="h-5 w-5 text-primary" /><div className="mt-4 font-medium">Москва, ул. Здоровья, 15</div><div className="text-sm text-muted-foreground">м. Проспект Мира</div></Card>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> info@meridian-clinic.ru
          </div>
          <div>© {new Date().getFullYear()} Клиника Меридиан</div>
        </div>
      </footer>
    </div>
  );
}
