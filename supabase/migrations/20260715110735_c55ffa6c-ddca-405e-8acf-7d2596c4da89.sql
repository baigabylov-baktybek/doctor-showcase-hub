
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.doctors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors are viewable by everyone"
  ON public.doctors FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert doctors"
  ON public.doctors FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update doctors"
  ON public.doctors FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete doctors"
  ON public.doctors FOR DELETE TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for doctors bucket (public read, auth write)
CREATE POLICY "Doctor images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'doctors');

CREATE POLICY "Authenticated users can upload doctor images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'doctors');

CREATE POLICY "Authenticated users can update doctor images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'doctors');

CREATE POLICY "Authenticated users can delete doctor images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'doctors');
