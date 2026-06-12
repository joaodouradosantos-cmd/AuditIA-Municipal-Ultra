# AuditIA Municipal Ultra Online

Aplicação web/PWA para apoio à auditoria municipal, com frontend estático na Vercel, API serverless para IA e memória online em Supabase.

## Estrutura
- `public/` — interface da aplicação e PWA
- `api/` — backend serverless Vercel para IA e memória online
- `supabase/schema.sql` — tabela necessária para guardar a memória online
- `package.json` — dependências da API

## Variáveis de ambiente na Vercel
Configurar em Project Settings > Environment Variables:

- `OPENAI_API_KEY` — chave da OpenAI
- `OPENAI_MODEL` — opcional, por defeito `gpt-4o-mini`
- `ANTHROPIC_API_KEY` — opcional, se quiser usar Claude
- `ANTHROPIC_MODEL` — opcional
- `SUPABASE_URL` — URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — service role key do Supabase, apenas no backend Vercel
- `AUDITIA_ACCESS_CODE` — código pessoal para proteger a memória online

## Supabase
Executar o conteúdo de `supabase/schema.sql` no SQL Editor do Supabase.

## Deploy
Fazer push para GitHub e importar o repositório na Vercel.
