# StockVision

Aplicação full stack para organizar um inventário de itens por ambientes. A interface permite entrar na aplicação e consultar e gerenciar itens; a API oferece operações de itens e ambientes.

## Tecnologias

- **Back-end:** Java 26, Spring Boot, Spring Security, Spring Data JPA e Maven.
- **Front-end:** React, Vite, HeroUI e Tailwind CSS.
- **Banco de dados:** MySQL.

A autenticação usa sessão HTTP. O perfil de desenvolvimento cria uma conta local e ambientes iniciais.

## Executar localmente

Requisitos: JDK 26, Node.js, npm e MySQL acessível. O usuário do MySQL precisa ter permissão para criar o banco ou ele deve existir previamente.

1. Clone o repositório e entre na pasta:

   ```sh
   git clone https://github.com/luigidarco/StockVision.git
   cd StockVision
   ```

2. Configure as variáveis de ambiente para o MySQL e a conta local. Ajuste os valores ao seu ambiente; a aplicação não carrega o arquivo `.env.example` automaticamente.

   ```sh
   export SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/StockVisionManagement?createDatabaseIfNotExist=true&serverTimezone=UTC'
   export SPRING_DATASOURCE_USERNAME='root'
   export SPRING_DATASOURCE_PASSWORD='sua-senha-do-mysql'
   export SPRING_PROFILES_ACTIVE='dev'
   export STOCKVISION_DEV_EMAIL='admin@stockvision.local'
   export STOCKVISION_DEV_PASSWORD='sua-senha-local'
   ```

3. Inicie a API:

   ```sh
   ./mvnw spring-boot:run
   ```

4. Em outro terminal, inicie a interface:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

Acesse [http://localhost:5173](http://localhost:5173) e entre com o e-mail e a senha definidos acima. O Vite encaminha as requisições de `/api` para a API em `localhost:8080`. Se a conta já existir, mudar a variável de senha não redefine sua senha no banco.

## Verificação

- Após o login, consulte a lista de itens e experimente cadastrar, editar e excluir um item.
- Para executar os testes do back-end: `./mvnw test`.
- Para compilar a interface: `cd frontend && npm run build`.

As configurações e a conta do perfil `dev` são destinadas ao desenvolvimento local.
