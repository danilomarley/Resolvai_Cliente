# Auditoria de dependências do frontend

Revisão de 2026-11-06, separada das funcionalidades da Sprint 4.

Atualizações compatíveis no lockfile corrigem os alertas altos de
brace-expansion e source-map-js. A auditoria completa passa de 11 entradas
(3 altas, 8 moderadas) para 9 (1 alta, 8 moderadas). A auditoria com
`--omit=dev` retorna zero entradas antes e depois.

Restam Vite/esbuild e a cadeia typescript-eslint/minimatch. A correção
sugerida pelo npm para Vite requer mudança principal (8.3.6). A versão
compatível atual de typescript-eslint ainda depende de minimatch 10;
o advisory exige 11.0.1 ou superior. Não foram aplicados overrides ou
atualizações principais sem validação específica.

Os avisos de Vite/esbuild afetam o servidor/ferramentas de desenvolvimento,
incluindo exposição de arquivos e mecanismos de abertura de editor no
Windows; minimatch afeta o processamento de padrões no lint. Não basta
classificá-los como dependências de desenvolvimento para eliminar o risco.
Até a migração validada, limitar o servidor à máquina local, evitar sessões
de desenvolvimento em redes não confiáveis e não fornecer segredos ou
configurações de produção às ferramentas. A stack E2E usa somente dados
sintéticos e variáveis locais explícitas.

Validação das atualizações: 21 testes aprovados, lint e build. O produto
compilado mantém zero alertas de dependências de runtime conhecidos.

Fontes: npm audit e advisories associados, incluindo
https://github.com/advisories/GHSA-67mh-4wv8-2f99,
https://github.com/advisories/GHSA-g3hv-75wg-m249 e
https://github.com/advisories/GHSA-4w7w-66w2-5vf9.
