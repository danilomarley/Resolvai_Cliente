-- Execute somente no banco do projeto Supabase usado pelo backend.
-- Primeiro diagnóstico: não altera dados. Não retorna hashes ou senhas.
select a.id as auth_id,
       a.email_confirmed_at is not null as email_confirmado,
       p.id as perfil_id,
       p.is_active as perfil_ativo,
       p.role as papel
from auth.users a
left join public.users p on p.id = a.id or lower(p.email::text) = lower(a.email)
where lower(a.email) = 'teste@gmail.com';

select conname, pg_get_constraintdef(oid) as definicao
from pg_constraint
where conrelid = 'public.users'::regclass and contype = 'c';

-- Regularização: insere SOMENTE um perfil ausente para a identidade existente.
-- Não cria identidade Auth, não muda senha, não ativa perfis existentes,
-- não promove papéis e não troca UUIDs de perfis de outras identidades.
-- Requer schema compatível com o enum atual do backend: Cliente/Prestador/Admin.
-- A migração antiga aceita Viewer/Inspector/Admin; se ainda estiver vigente,
-- o INSERT falhará e será revertido. A migração precisa ser tratada no backend.
begin;
do $$
declare
    identidade auth.users%rowtype;
    perfil public.users%rowtype;
begin
    select * into strict identidade
    from auth.users
    where lower(email) = 'teste@gmail.com';

    if identidade.email_confirmed_at is null then
        raise exception 'Confirme o e-mail antes de regularizar o perfil.';
    end if;

    begin
        select * into strict perfil
        from public.users
        where id = identidade.id or lower(email::text) = lower(identidade.email)
        for update;
    exception
        when no_data_found then
            perfil := null;
        when too_many_rows then
            raise exception 'Mais de um perfil corresponde à identidade. Requer análise pelo responsável pelo backend.';
    end;

    if perfil.id is not null then
        if perfil.id <> identidade.id then
            raise exception 'Existe perfil com outro UUID. Requer análise pelo responsável pelo backend.';
        end if;
        if not perfil.is_active then
            raise exception 'O perfil está inativo. Este script não altera seu estado.';
        end if;
        if perfil.role <> 'Cliente' then
            raise exception 'O perfil existente não possui papel Cliente. Este script não altera seu papel.';
        end if;
        raise notice 'Perfil já existe; nenhuma alteração realizada.';
        return;
    end if;

    insert into public.users (id, name, email, role, is_active, created_at, updated_at)
    values (
        identidade.id,
        coalesce(nullif(trim(identidade.raw_user_meta_data ->> 'name'), ''),
                 nullif(trim(identidade.raw_user_meta_data ->> 'full_name'), ''), 'teste'),
        identidade.email,
        'Cliente',
        true,
        now(),
        null
    );
end $$;
commit;
