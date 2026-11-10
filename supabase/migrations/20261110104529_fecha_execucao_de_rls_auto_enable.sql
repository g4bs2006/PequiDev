-- A função public.rls_auto_enable() veio com o projeto: ela liga o RLS em toda
-- tabela nova, disparada pelo event trigger ensure_rls. Ninguém precisa chamá-la
-- pela API, então a permissão de execução sai. O event trigger continua valendo.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
