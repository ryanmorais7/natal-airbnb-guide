-- Suporte a multiplas propriedades por conta (plano Pro, ate 5)
-- Cada propriedade extra continua sendo uma linha normal em hosts,
-- ligada a conta dona via owner_id. Mesma logica do admin_manage_hosts,
-- so que escopada ao proprio dono em vez de ao admin do site.

ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE POLICY "owner_manage_hosts" ON public.hosts
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "owner_manage_content" ON public.guide_content
  FOR ALL USING (EXISTS (SELECT 1 FROM hosts WHERE hosts.id = guide_content.host_id AND hosts.owner_id = auth.uid()));

CREATE POLICY "owner_manage_room_media" ON public.room_media
  FOR ALL USING (EXISTS (SELECT 1 FROM hosts WHERE hosts.id = room_media.host_id AND hosts.owner_id = auth.uid()));

CREATE POLICY "owner_manage_guest_tokens" ON public.guest_tokens
  FOR ALL USING (EXISTS (SELECT 1 FROM hosts WHERE hosts.id = guest_tokens.host_id AND hosts.owner_id = auth.uid()));
