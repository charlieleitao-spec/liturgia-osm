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
