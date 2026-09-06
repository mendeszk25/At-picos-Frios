-- Atípicos Frios — backend gratuito no Supabase.
-- Execute em um projeto Supabase Free NOVO/dedicado ao site.

create table if not exists public.atipicos_produtos (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,80}$'),
  dados jsonb not null check (jsonb_typeof(dados) = 'object'),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.atipicos_sessoes (
  hash text primary key check (hash ~ '^[a-f0-9]{64}$'),
  expira timestamptz not null,
  criado_em timestamptz not null default now()
);
create index if not exists atipicos_sessoes_expira on public.atipicos_sessoes(expira);

create table if not exists public.atipicos_limite (
  chave text primary key check (length(chave) between 1 and 160),
  tentativas integer not null check (tentativas >= 0),
  ate timestamptz not null
);

alter table public.atipicos_produtos enable row level security;
alter table public.atipicos_sessoes enable row level security;
alter table public.atipicos_limite enable row level security;

-- Produtos: somente leitura pública. Não existe policy pública de escrita.
drop policy if exists "atipicos_produtos_leitura_publica" on public.atipicos_produtos;
create policy "atipicos_produtos_leitura_publica"
on public.atipicos_produtos
for select
to anon, authenticated
using (true);

grant select on table public.atipicos_produtos to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.atipicos_produtos from anon, authenticated;
revoke all on table public.atipicos_sessoes from anon, authenticated;
revoke all on table public.atipicos_limite from anon, authenticated;
grant select, insert, update, delete on table public.atipicos_produtos, public.atipicos_sessoes, public.atipicos_limite to service_role;

-- Reserva atômica de tentativas. Só a chave secreta do servidor pode executar.
create or replace function public.atipicos_reservar_tentativa(
  p_chave text,
  p_limite integer,
  p_janela_segundos integer
)
returns table (permitido boolean, tentar_em_segundos integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.atipicos_limite%rowtype;
begin
  if p_chave is null or length(p_chave) < 1 or length(p_chave) > 160
     or p_limite < 1 or p_limite > 1000
     or p_janela_segundos < 1 or p_janela_segundos > 86400 then
    raise exception 'parametros invalidos';
  end if;

  insert into public.atipicos_limite (chave, tentativas, ate)
  values (p_chave, 1, now() + make_interval(secs => p_janela_segundos))
  on conflict (chave) do update set
    tentativas = case
      when public.atipicos_limite.ate <= now() then 1
      else public.atipicos_limite.tentativas + 1
    end,
    ate = case
      when public.atipicos_limite.ate <= now() then now() + make_interval(secs => p_janela_segundos)
      else public.atipicos_limite.ate
    end
  returning * into r;

  permitido := r.tentativas <= p_limite;
  tentar_em_segundos := greatest(1, ceil(extract(epoch from (r.ate - now())))::integer);
  return next;
end;
$$;

revoke all on function public.atipicos_reservar_tentativa(text, integer, integer) from public, anon, authenticated;
grant execute on function public.atipicos_reservar_tentativa(text, integer, integer) to service_role;

-- Bucket público para exibição das imagens. Upload/alteração/exclusão continuam
-- bloqueados para anon/authenticated porque não criamos policies de escrita.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos', 'produtos', true, 1572864,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Limpeza opcional e segura de sessões/limites vencidos ao reaplicar a migration.
delete from public.atipicos_sessoes where expira <= now();
delete from public.atipicos_limite where ate <= now();

-- Catálogo inicial: só insere IDs que ainda não existem.
insert into public.atipicos_produtos (id, dados) values ('1', '{"nome":"Queijo Coalho Geason Diniz","descricao":"Assa com sal, direto na chapa ou churrasqueira.","preco":23,"precoAntigo":null,"unidade":"barra","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":true,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('2', '{"nome":"Kit Churrasco Geason Diniz","descricao":"Linguiça gourmet, queijo coalho e farofa gourmet.","preco":null,"precoAntigo":null,"unidade":"kit completo","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":true,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('3', '{"nome":"Linguiça Gourmet","descricao":"De bode e outras opções gourmet, direto da churrasqueira.","preco":null,"precoAntigo":null,"unidade":"un.","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":false,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('4', '{"nome":"Frios em Bandeja","descricao":"Seleção de frios fatiados, prontos para servir.","preco":10,"precoAntigo":null,"unidade":"bandeja","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":false,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('5', '{"nome":"Bandeja de Frios do Dia","descricao":"R$10,00 a bandeja — confira o que chegou hoje.","preco":10,"precoAntigo":null,"unidade":"bandeja","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('6', '{"nome":"Bandejas de Frios Sortidos","descricao":"Variedade que encanta, com frescor garantido todo dia.","preco":null,"precoAntigo":null,"unidade":"bandeja","imagem":"images/em-breve.png","catalogo":true,"novo":true,"oferta":false,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('7', '{"nome":"Morangos Congelados Dona Horta","descricao":"Ideais para açaí, vitaminas e sobremesas.","preco":10,"precoAntigo":null,"unidade":"un. · 5 un. por R$47,50","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('8', '{"nome":"Filé de Peito Jussara","descricao":"Congelado individualmente (IQF), pronto para usar 1 a 1.","preco":null,"precoAntigo":null,"unidade":"un. (IQF)","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":true,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('9', '{"nome":"Bebidas Itambé & Fruty Bom","descricao":"Coco, uva e sabores selecionados.","preco":10,"precoAntigo":null,"unidade":"un.","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('10', '{"nome":"Molho Pronto Italac","descricao":"4 queijos ou branco, prático e saboroso.","preco":4,"precoAntigo":null,"unidade":"un. · 3 un. por R$10","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('11', '{"nome":"Biscoito Marilan Manteiga","descricao":"Aquele clássico para o café da tarde.","preco":null,"precoAntigo":null,"unidade":"pacote · 3 por R$10","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('12', '{"nome":"3 Bandejas Natural Gurt","descricao":"Sabor morango, cremoso e geladinho.","preco":10,"precoAntigo":null,"unidade":"as 3 bandejas","imagem":"images/em-breve.png","catalogo":true,"novo":false,"oferta":true,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
insert into public.atipicos_produtos (id, dados) values ('13', '{"nome":"Açaí Cremoso e Natural","descricao":"100% natural, perfeito para refrescar o dia e dividir com a família.","preco":null,"precoAntigo":null,"unidade":"cuba","imagem":"images/em-breve.png","catalogo":true,"novo":true,"oferta":false,"destaque":false,"disponivel":true}'::jsonb) on conflict (id) do nothing;
