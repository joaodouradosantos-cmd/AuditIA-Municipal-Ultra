# AuditIA Municipal Ultra

Aplicação web/PWA para apoio à auditoria municipal, contratação pública, controlo interno, relatórios e análise jurídica com IA.

## Versão Vercel gratuita

Esta versão foi adaptada para funcionar online na Vercel sem Firebase Functions.

Estrutura:

- `public/` — interface da aplicação e PWA
- `api/` — backend serverless da Vercel para OpenAI/Claude
- `package.json` — dependências da API

## Deploy na Vercel

1. Criar repositório no GitHub.
2. Enviar todos os ficheiros deste projeto para o repositório.
3. Na Vercel, importar o repositório.
4. Framework Preset: **Other**.
5. Deploy.

## Variáveis de ambiente na Vercel

Para a IA funcionar, configurar pelo menos uma destas chaves em:

`Project > Settings > Environment Variables`

- `OPENAI_API_KEY`
- opcional: `OPENAI_MODEL` (por defeito usa `gpt-4o-mini`)
- `ANTHROPIC_API_KEY`
- opcional: `ANTHROPIC_MODEL`

Depois de adicionar as variáveis, fazer novo deploy.

## Dados

Esta versão simples guarda a atividade localmente no navegador (`localStorage`). Não tem base de dados online.

## Segurança

Nunca colocar chaves OpenAI/Claude em ficheiros públicos, HTML ou JavaScript do frontend.
As chaves devem ficar apenas nas variáveis de ambiente da Vercel.
