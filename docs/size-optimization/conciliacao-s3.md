# Estado consolidado — release 4.9.132 e código posterior

Verificação em 6 de novembro de 2026 (Curitiba), após a correção do grau de 16/11. Referências conferidas diretamente no GitHub; não foi feita nova compilação nem instalação em aparelho.

| Artefato | Identificação | Estado comprovado |
| --- | --- | --- |
| APK público 4.9.132 | tag `v4.9.132`, commit `b8944dd4c25d8a04342710557b5d9c59b4c92109`, Android 41045 | Publicado em 5/11; arquivo não substituído nesta consolidação |
| Otimização do PR #150 | merge `3cf5be65cd9ed31030ae01ce0b77d80421349dd5`, 6/11 | Integrada à main depois da release; ainda não incorporada ao APK público |
| Correção de 16/11 | commit `29931e7195bd08daf257782a772c968598fb68e7` | rank Festa no santoral e na Missa; base derivada do Hoje sincronizada; não incorporada ao APK público |

## Identidade do download público

- Arquivo: [Liturgia-OSM-4.9.132.apk](https://github.com/charlieleitao-spec/liturgia-osm/releases/download/v4.9.132/Liturgia-OSM-4.9.132.apk).
- SHA-256 informado pelo GitHub: `0861c11cb97c7c16dcbd812a35ace5aae0b84928fb627cccd86995db6fd7f3fe`.
- A existência de candidatos também identificados como 4.9.132 não os torna o mesmo binário da release. Usar origem e hash para identificar cada artefato.
- Não se presume qual candidato está instalado no A56 apenas pelo número exibido. Esta revisão não solicita repetir testes físicos já aceitos.

## Diferenças relevantes depois da release

- 66 PDFs otimizados, remoção de oito fontes sem uso, metadados da busca e cache específico do PR #150.
- A comparação líquida entre a tag e a main não mostra alteração em `www/app.js`, `www/app.css` ou `www/index.html`; não atribuir uma nova revisão desses arquivos à integração do PR.
- Somente o grau textual de 16/11 foi corrigido nos dados: de Solenidade para Festa, coerente com `grau=festa` e com o Missal oficial. Datas, textos litúrgicos e PDFs foram preservados nessa correção.
- [Comparação tag → main](https://github.com/charlieleitao-spec/liturgia-osm/compare/v4.9.132...main).

## Evidências aproveitadas

- [Release pública validada](https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42107057212).
- [Revisão visual e regressões do candidato do PR #150](https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42202182766): aprovada; evidência de CI, não novo aceite físico.
- [APK candidato do PR #150](https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42202182787): compilação aprovada, distinta do download público.
- [Fonte comum na main após merge](https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42221816566): aprovada.
- [Geração e sincronização da base derivada após correção de 16/11](https://github.com/charlieleitao-spec/liturgia-osm/actions/runs/42317232025): aprovada.

## Encaminhamento

Conciliação documental concluída. O PR #150 já foi integrado; não aguarda merge. As melhorias posteriores permanecem reunidas para eventual versão futura, sem substituir a tag 4.9.132 ou presumir autorização para compilar. Conferir o escopo e as verificações pertinentes antes de uma futura release.

---

## Histórico preservado — etapas anteriores à integração

As expressões “atual”, “aguardar workflows” e “merge não realizado” abaixo descrevem o momento histórico de cada registro e não o estado consolidado acima.

# Conciliação atual s3 — PR #150 com a release 4.9.132

Verificação de 6 de novembro de 2026. Base atual: `b8944dd4c25d8a04342710557b5d9c59b4c92109` (release pública 4.9.132). Esta atualização incorpora essa base ao PR sem alterar a tag nem a release publicada.

- Mantém `package.json`, lockfile e `APP_VERSION` em 4.9.132. Preserva os workflows de publicação 4.9.131/4.9.132 e a integração de fontes s21.
- Conserva os 66 PDFs otimizados, com SHA-256 idêntico ao inventário já aprovado; sem recompressão e sem repetição da auditoria visual dos PDFs.
- Conserva os 708 documentos, as 82 fontes da busca, Cinzel e sua licença. Remove as oito fontes não utilizadas e suas referências no cache.
- Cache específico `liturgia-osm-v4.9.132-personal-v1-fontes-s21-assets-pr150`, com 148 recursos existentes. O sufixo impede confundir o cache do candidato otimizado com o da release pública.
- Workflow de teste alinhado a 4.9.132/41045, mesma identidade e certificado estável. Eventual APK otimizado é candidato do PR, distinto do APK da release pública; não substituir o download publicado.
- A conciliação é incorporada à branch do PR. Não realiza merge em main, publicação, alteração de tag nem teste físico no Samsung A56.

A documentação abaixo preserva o histórico da proposta 4.9.131. Identificações e próximos passos históricos não descrevem o estado atual.

---

# Conciliação s3 — PR #150

A proposta 4.9.131 concilia a otimização do PR #150 com main edd1648e666925929005d29ebc9ac8ae8d40f1df, preservando revisões marianas, apresentação visual e o link Caminho Servita.

## Identificação dos artefatos

| Artefato | Identificação | Situação |
| --- | --- | --- |
| Otimização histórica do PR #150 | 4.9.129; f8003c3; APK SHA-256 3d0b05e0a07a1b1cc6488ba28d50e5ccaad00d9b602fea0ddd4c262ca2a2eabc | Teste histórico; diferente da release pública 4.9.129 |
| Release pública | 4.9.130; tag a20a74d4c6b288c60183ea2270505ea894330807 | Preservada |
| Candidato posterior de revisão visual | 4.9.130; 5cb5a01549ee7fe894072e156b398ae269d340d2; execução 41380806839 | Diferente da release publicada |
| Conciliação atual | 4.9.131; Android 41044 | Proposta em PR, sem release publicada |

A versão estável no aparelho deve continuar vinculada à última aprovação física já registrada. Este trabalho não realizou instalação nem teste no Samsung A56.

## Recursos e validações preservados

Os 66 PDFs são byte a byte os aprovados na execução 40710510967 (364485fb38a8badc3e1566b7f6bce456deb597d4). O relatório e os inventários históricos permanecem em 4.9.129; suas referências a main 4.9.128 e à inexistência de release descrevem aquele momento, não o estado atual.

Não houve nova recompressão. Total dos PDFs: 7.111.456 → 5.579.849 bytes. As oito fontes sem uso são removidas; Cinzel e sua licença permanecem.

O índice foi regenerado a partir dos dados atuais: os mesmos 708 documentos da main e todas as revisões posteriores foram preservados. Apenas hashes dos PDFs mudaram nas 82 fontes do índice. O cache mantém 148 recursos e passa a identificar 4.9.131.

A conciliação aproveita as evidências aceitas; não repete a auditoria integral dos PDFs nem os testes antigos de instalação/emulador. As verificações locais novas conferiram identidade dos recursos, índice atual, caminhos do cache, sintaxe JavaScript e aplicação do patch.

O workflow de APK de teste foi alinhado a 4.9.131/41044 e guarda identidade e assinatura junto do artefato. Não publica releases. Os workflows de publicação permanecem inalterados.

Os scripts/workflow históricos específicos de teste 4.9.129 permanecem nos commits originais; não são transportados para uma nova compilação como se ainda representassem o código atual.

## Próximo passo

Aguardar os workflows automáticos desta atualização, conferir resultados e artefatos e registrar no item s3. Não confundir CI aprovado com aprovação física do A56. Merge e publicação não foram realizados por esta atualização.
