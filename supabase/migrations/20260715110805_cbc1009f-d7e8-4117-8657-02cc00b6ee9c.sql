
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-grant admin to the first user (bootstrap)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Replace doctors policies with admin-only
DROP POLICY "Authenticated users can insert doctors" ON public.doctors;
DROP POLICY "Authenticated users can update doctors" ON public.doctors;
DROP POLICY "Authenticated users can delete doctors" ON public.doctors;

CREATE POLICY "Admins can insert doctors"
  ON public.doctors FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctors"
  ON public.doctors FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete doctors"
  ON public.doctors FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage: restrict writes to admins
DROP POLICY "Authenticated users can upload doctor images" ON storage.objects;
DROP POLICY "Authenticated users can update doctor images" ON storage.objects;
DROP POLICY "Authenticated users can delete doctor images" ON storage.objects;

CREATE POLICY "Admins can upload doctor images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'doctors' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update doctor images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'doctors' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete doctor images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'doctors' AND public.has_role(auth.uid(), 'admin'));
