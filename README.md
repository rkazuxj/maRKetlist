# maRKetlist

Aplicativo responsivo de listas de compras e receitas, sem dependências externas.

## Executar

Com Node.js instalado, execute `node server.mjs` (ou `npm start`) e abra http://localhost:4173. Use um servidor HTTP: abrir o HTML diretamente como arquivo não permite carregar os módulos e o JSON de receitas.

Execute `node --test tests/domain.test.mjs` (ou `npm test`) para validar os dados, duplicados, persistência e compartilhamento.

## Recursos

- Criação em DRAFT: adicionar/remover produtos e confirmar em “Criar lista” para ativar e retornar à aba Listas. Rascunhos persistem em localStorage e podem ser retomados na seção “Em preparação”.
- Listas ACTIVE oferecem “Editar lista” (inserir/remover produtos e voltar com “Salvar alterações”) e “Abrir lista” (riscar produtos e concluir). As alterações de produtos são salvas automaticamente, preservando as marcações existentes. Listas concluídas ficam no histórico COMPLETED.
- Dezesseis receitas com fotos fornecidas pelo usuário na pasta `img` (nomes em `img/LEIA-ME.md`). Busca por nome, categorias, seleção de ingredientes e adição em lista existente ou nova.
- Duplicados identificados pelo nome, ignorando maiúsculas, acentos e espaços extras. A soma exige unidades iguais; unidades diferentes permitem adicionar separadamente ou ignorar. Não há conversão de unidades nem singularização automática.
- Compartilhamento com JSON validado, versionado e codificado em Base64URL no fragmento da URL. Preview antes de importar; novos IDs, status ACTIVE e itens desmarcados.
- Web Share API quando disponível e botão Copiar link. Se a área de transferência estiver indisponível, o campo permite cópia manual.

## Publicação e limites

### Vercel via GitHub

1. Envie ao GitHub também `vercel.json`, `build.mjs` e `package.json`, junto do HTML e das pastas do aplicativo.
2. No Vercel, a **Root Directory** deve ser a pasta que contém `index.html` e `vercel.json`. Se estiverem na raiz do repositório, deixe a pasta raiz padrão. Se estiverem dentro de `maRKetlist`, selecione essa subpasta.
3. A configuração versionada define **Framework Preset: Other**, **Build Command: node build.mjs** e **Output Directory: dist**. Não use `npm start` como comando de build.
4. Faça um novo deploy do commit atualizado. O build copia os arquivos públicos para `dist`; não é necessário enviar essa pasta ao GitHub.

Para verificar a saída localmente, execute `node build.mjs`. As URLs internas usam `#/lists`, `#/recipes` etc.; o fragmento é tratado pelo navegador e não exige redirecionamento de rotas no Vercel. `server.mjs` é usado somente na prévia local.

### Limitações

Publique index.html, css, js, assets, img e data em qualquer hospedagem estática HTTPS para que os links possam ser abertos por outras pessoas. Um endereço localhost só funciona no próprio dispositivo. O compartilhamento nativo depende de HTTPS (ou localhost), do navegador e dos aplicativos instalados; a aplicação não controla quais destinos aparecem.

Base64URL é codificação, não criptografia. Qualquer pessoa com o link pode ler os produtos. O fragmento não é enviado ao servidor HTTP. O limite desta versão é 150 produtos e 24 mil caracteres codificados; aplicativos de mensagens podem impor limites menores.

As cópias são independentes, sem autenticação, backend ou colaboração em tempo real. Os dados pertencem ao navegador e origem atuais; limpar os dados do site remove as listas. Falhas de armazenamento são informadas e dados inválidos existentes não são sobrescritos.

## Organização

- `data/recipes.json`: catálogo com ingredientes estruturados e identificadores estáveis.
- `js/domain.js`: conversão de ingredientes, regras de duplicidade, repositório local, fonte de receitas e adaptador de compartilhamento.
- `js/script.js`: navegação e interface.
- `assets`: logo preservada em SVG, com a paleta azul.
- `img`: fotos das receitas em JPG; consulte `img/LEIA-ME.md`.

Os repositórios e o adaptador de compartilhamento delimitam os pontos de integração futura com Supabase. Uma integração remota também deverá tornar o carregamento/gravação de listas assíncronos e tratar autenticação, conflitos e assinaturas de atualizações. Favoritos, receitas do usuário, planejamento de refeições e recomendações não estão implementados.
