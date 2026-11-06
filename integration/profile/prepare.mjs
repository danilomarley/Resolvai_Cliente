import { readFileSync, writeFileSync } from 'node:fs'
import { assertTestDatabase, pool } from '../../.test-services/e2e/runtime.mjs'
const versions = JSON.parse(readFileSync('integration/profile/versions.json', 'utf8'))
if (process.argv[2] === 'reference') {
  writeFileSync('.test-services/e2e/backend-ref.json', JSON.stringify({ repository: 'Diegofreitas-mend/Resolvai_Backend_Node', sha: versions.backend }))
} else {
  const db = pool()
  try {
    await assertTestDatabase(db)
    await db.query("do $$ begin if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; end $$")
    // Scripts canônicos em checkouts de teste, sem copiar migrations para a branch #93.
    for (const file of ['012_create_fornecedores.sql', '013_create_especialidades_fornecedor.sql']) await db.query(readFileSync(`.professional-schema/db/scripts/${file}`, 'utf8'))
    await db.query(readFileSync('.review-api/db/scripts/013_create_avaliacoes.sql', 'utf8'))
  } finally { await db.end() }
}
