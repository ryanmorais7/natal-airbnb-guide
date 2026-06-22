-- O código (js/painel.js upload de "Vídeo de entrada" + js/guia.js exibição
-- pro hóspede) já usa room='entrada' em room_media, mas a constraint do banco
-- nunca foi atualizada pra aceitar esse valor — só permitia bedroom/kitchen/bathroom.

ALTER TABLE public.room_media DROP CONSTRAINT IF EXISTS room_media_room_check;
ALTER TABLE public.room_media ADD CONSTRAINT room_media_room_check
  CHECK (room IN ('bedroom', 'kitchen', 'bathroom', 'entrada'));
