# StockVision

Gerenciamento de estoque com React e Spring Boot. A interface do lançamento inicial usa português do Brasil (pt-BR), incluindo mensagens de validação, recursos de acessibilidade e formatação de números.

## Executar localmente

Inicie o MySQL e configure as variáveis `SPRING_DATASOURCE_*` descritas em `.env.example`. Configure as seguintes variáveis na configuração de execução do backend no IntelliJ ou exporte-as no terminal antes de iniciar o Maven:

```text
SPRING_PROFILES_ACTIVE=dev
STOCKVISION_DEV_EMAIL=admin@stockvision.local
STOCKVISION_DEV_PASSWORD=sua-senha-local
```

A aplicação não carrega arquivos `.env` automaticamente. O perfil de desenvolvimento exige uma senha e cria uma conta com a senha protegida por BCrypt. Em um banco existente, ele atribui as credenciais a um usuário sem e-mail antes de criar outro usuário, preservando seus ambientes. A senha de uma conta existente não é redefinida ao reiniciar.

Inicie o backend:

```sh
./mvnw spring-boot:run
```

Inicie o frontend em outro terminal:

```sh
cd frontend
npm ci
npm run dev
```

Abra <http://localhost:5173/login> e entre com o e-mail e a senha configurados. Reinicie o backend se ele já estiver em execução para carregar as alterações de autenticação.

## Fluxo de autenticação e responsabilidades dos arquivos

- `frontend/src/App.jsx` escolhe a página de estoque autenticada ou redireciona para `/login`.
- `frontend/src/pages/LoginPage.jsx` e seu CSS cuidam do formulário de entrada e do visual inspirado na referência. `LoginArtwork.jsx` contém os SVGs decorativos.
- `frontend/src/auth/AuthProvider.jsx` consulta `/api/auth/me` e mantém os dados públicos do usuário da sessão.
- `frontend/src/auth/AuthContext.js` define o contexto compartilhado, e `useAuth.js` expõe o hook que o consulta. O provider exporta somente o componente para preservar o Fast Refresh do Vite.
- `frontend/src/api/` cuida das requisições HTTP, das chamadas de entrada e saída e dos cabeçalhos CSRF.
- `frontend/src/pages/InventoryPage.jsx` contém a tela de estoque existente e a ação de sair.
- `frontend/src/utils/formatCount.js` formata as contagens em pt-BR e aplica singular ou plural.
- `src/main/java/org/stockvision/auth/` configura o Spring Security, carrega as credenciais e expõe as respostas do usuário atual e do token CSRF.

O navegador usa um cookie de sessão HttpOnly. A tela de estoque só é montada depois que o servidor confirma a autenticação. Requisições de estoque sem autenticação recebem o status 401; o frontend redireciona para a página de entrada quando uma requisição informa que a sessão expirou. O formulário envia `email` e `password` para `/api/auth/login` no formato de formulário. Os filtros do Spring Security processam a entrada e a saída, com proteção CSRF habilitada.

O formulário permite entrar com e-mail e senha e mostrar ou ocultar a senha. A autenticação com Google, o cadastro e a recuperação de senha são funcionalidades futuras.

A autenticação está implementada nesta etapa. A verificação de que cada usuário só acessa seus próprios itens e ambientes será a próxima etapa do [plano de aprendizado](docs/authentication-plan.md).

## Verificar

```sh
./mvnw test
cd frontend
npm run build
```

Os testes de integração de autenticação usam um banco H2 isolado e cobrem acesso anônimo, credenciais inválidas, autenticação e persistência da sessão, ausência de senhas na resposta de `/me`, rejeição de requisições sem token CSRF e encerramento da sessão.
