# Conteúdo compartilhado da Família Servita

| Conteúdo | Fonte principal | Consumidores |
| --- | --- | --- |
| Santoral e liturgia | `liturgia-osm/www/data` | Liturgia OSM e processo existente de geração da base do Hoje |
| Catálogo da Biblioteca | `liturgia-osm/www/data/biblioteca-servita-catalogo.json` | Espelho `data/` do Liturgia, catálogo local do Hoje, resumo da página Recursos do Somos Servos |
| PDFs da Biblioteca | `liturgia-osm/www/data/pdfs/biblioteca` | Cópias locais verificadas dos aplicativos; página Recursos aponta para o leitor do Hoje |
| Ramos e vocação | `somos-servos-app/recursos.html#familia` | Página comum acessada pelos aplicativos e pelo blog |

Artigos próprios do Blogger continuam editoriais; esta integração não os reescreve nem afirma sincronizá-los.

## Atualizar o catálogo

Edite somente `www/data/biblioteca-servita-catalogo.json`. Gere o espelho local:

```sh
python scripts/sync-servita-content.py --source . --target . --profile source
```

Após revisar e integrar a fonte, use um checkout limpo do Liturgia na revisão aprovada. Substitua `SHA_COMPLETO` pelo SHA real de 40 caracteres:

```sh
python fonte/scripts/sync-servita-content.py --source fonte --target hoje-familia-servita --profile hoje --source-commit SHA_COMPLETO
python fonte/scripts/sync-servita-content.py --source fonte --target somos-servos-app --profile somos --source-commit SHA_COMPLETO
```

Cada consumidor registra revisão e hashes em `conteudo-servita.lock.json`. O GitHub confere o checkout dessa revisão fixa com `--check`. O resumo entre os marcadores `BEGIN SERVITA CATALOG` e `END SERVITA CATALOG` no Somos Servos é gerado a partir dos mesmos títulos, em HTML estático.

## Offline e revisão

O sincronizador não acessa a rede nem modifica PDFs. No Hoje, os arquivos locais e o manifesto Android devem corresponder à fonte; divergências interrompem a operação antes de gravar o catálogo. Documentos novos exigem incorporação e revisão prévias dos PDFs. Os aplicativos mantêm suas cópias locais e o acesso offline.

Não foram criados agendamentos, credenciais ou publicações automáticas. Calendário, graus, favoritos e artigos próprios do Blogger ficam preservados. Execute `python scripts/test-servita-content.py` para testar divergência, procedência e preservação dos arquivos.
