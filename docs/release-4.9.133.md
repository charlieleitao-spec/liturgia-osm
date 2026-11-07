# Liturgia OSM 4.9.133

Publicação definitiva autorizada por Frei Charlie em 07/11/2026 nesta conversa, após retorno positivo sobre o APK 4.9.132-padrao-teste2. PR #157 integrado em e0d19ccf398bcb5de7ed6de86c212525ced48482.

- Código de apresentação aprovado: 475c50600ab3c356785553a45fc330e92316290c.
- Execuções aprovadas do teste 2: APK/assinatura/conteúdo 42400617379; revisão visual 42400617529.
- APK definitivo: 4.9.133, versionCode 41048 (superior a 41045 da release 4.9.132 e a 41046/41047 dos APKs de teste entregues).
- Pacote: com.liturgia_osm.app. Certificado estável SHA-256: 5b2b3319cc9f9bb61a14fb8a30e63044db225f7b930fca9568c82854f38b4fe0.

## Conteúdo preservado

A preparação altera somente APP_VERSION, chave de cache e versões próprias de package.json/package-lock.json. `verify-release-4.9.133.py` confronta todos os arquivos www, incluindo PDFs, com o commit do teste 2. Somente as duas identificações de versão são normalizadas nessa comparação; arquivos adicionados/removidos, textos, fontes, leitores e dependências diferentes impedem a publicação.

A compilação confere assinatura, identidade e igualdade byte a byte de todos os arquivos web/offline dentro do APK. Publica APK, SHA256SUMS.txt, assinatura.txt e identidade.txt na tag nova v4.9.133. Não substitui tags/releases anteriores. Após publicar, baixa o APK público e exige igualdade com o pacote compilado.

## Execução

O workflow release-4.9.133.yml dispara na integração deste arquivo em main e publica após todas as verificações, conforme autorização do responsável. Mantém execução manual para preparação ou publicação explicitamente confirmada. A revisão visual do PR continua ativa; o APK de teste é dispensado para branches release/, pois o conteúdo já foi aprovado.

O workflow genérico de teste acompanha 4.9.133 e identifica eventuais próximos artefatos como 4.9.133-padrao-teste3, código 41049. Uma próxima release definitiva deverá usar código Android superior ao maior teste distribuído.

## Limite da validação

A aprovação informada diz respeito à apresentação verificada pelo responsável no contexto dos testes orientados. Não constitui afirmação de execução física de cada texto, de todos os testes offline ou de nova instalação da 4.9.133. As verificações automatizadas são identificadas como tais.
