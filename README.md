# ♻️ EcoPoints

Sistema web de pontos por reciclagem: o usuário entrega materiais recicláveis, ganha pontos de acordo com o **peso** e o **tipo de material** e troca esses pontos por produtos e serviços de **empresas parceiras**.

- **Front-end:** React 18 + Vite + React Router
- **Back-end:** [json-server](https://github.com/typicode/json-server) (API REST sobre o arquivo `db.json`, já populado)

## Como rodar

```bash
npm install
npm start
```

- Front-end: http://localhost:5173
- API (json-server): http://localhost:3001

Também é possível subir separadamente: `npm run server` (API) e `npm run dev` (front).

## Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@ecopoints.com | admin123 |
| Usuária | maria@email.com | 123456 |
| Usuário | joao@email.com | 123456 |

## Funcionalidades

| Requisito | Onde |
|---|---|
| Cadastro e autenticação de usuários | `/cadastro`, `/login`; admin gerencia em **Usuários** |
| Cadastro de materiais | **Materiais** (admin) — nome, categoria, pontos por kg |
| Registro de entregas | **Entregas** — material, quantidade e peso (admin registra para qualquer usuário) |
| Cálculo de pontos | Automático: `pontos = round(peso_kg × pontos_por_kg)`, com prévia em tempo real |
| Consulta de pontos | **Meus Pontos** — saldo, total acumulado, resgatado, kg reciclados, histórico |
| Sistema de recompensas | **Recompensas** (catálogo e resgate com voucher), **Resgates**, **Gerenciar Recompensas** (admin) |
| Gerenciamento de parceiros | **Parceiros** (admin) — cadastro, edição, ativação/desativação |

### Regras de negócio
- Os pontos por kg são gravados na entrega no momento do registro, então alterar o valor de um material não muda o histórico.
- Saldo = soma dos pontos das entregas − pontos dos resgates (resgates cancelados devolvem os pontos e o estoque).
- O resgate valida saldo e estoque no momento da troca e gera um código voucher (`ECO-XXXXXX`).
- Materiais com entregas, parceiros com recompensas e recompensas já resgatadas não podem ser excluídos — apenas desativados.

## Estrutura

```
db.json                 banco do json-server (dados iniciais)
src/api/client.js       acesso à API
src/context/AuthContext.jsx  sessão do usuário
src/utils/points.js     cálculo de pontos e saldo
src/components/         Layout, CrudPage (cadastros genéricos), Modal...
src/pages/              telas do sistema
```

> ⚠️ Projeto acadêmico/demonstrativo: o json-server não tem autenticação real e as senhas ficam em texto puro no `db.json`. Para produção, use um back-end com hash de senha e tokens.
