import { readFileSync, writeFileSync } from 'node:fs'
const versions = JSON.parse(readFileSync('integration/reviews/versions.json', 'utf8'))
writeFileSync('.test-services/e2e/backend-ref.json', JSON.stringify({ repository: 'Diegofreitas-mend/Resolvai_Backend_Node', sha: versions.backend }))
