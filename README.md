<<<<<<< HEAD
# Zamio Guias — Plataforma SaaS de Guias para Anfitriões

Plataforma web multi-tenant que permite a anfitriões do Airbnb criar e gerenciar guias digitais personalizados para seus hóspedes, sem necessidade de conhecimento técnico.

---

## Sobre o Projeto

O projeto nasceu de uma necessidade real: criar um guia de chegada completo para hóspedes de uma propriedade no Airbnb. Evoluiu para uma plataforma SaaS onde **múltiplos anfitriões** podem comprar acesso, configurar seu próprio guia e compartilhar um link único com seus hóspedes.

O hóspede acessa apenas o guia — sem login, sem fricção. O anfitrião acessa o painel para editar tudo.

---

## Demonstração

| Página | Descrição |
|---|---|
| `index.html` | Guia pessoal do Zamio (vitrine do produto) |
| `login.html` | Acesso dos anfitriões |
| `painel.html` | Editor do guia (área restrita) |
| `admin.html` | Painel de administração geral |
| `guia.html?h=slug` | Guia público do hóspede (dinâmico) |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  HTML · CSS (Tailwind CDN) · JavaScript vanilla     │
└────────────────────┬────────────────────────────────┘
                     │ Supabase JS SDK
┌────────────────────▼────────────────────────────────┐
│                   SUPABASE                          │
│                                                     │
│  ┌──────────────┐  ┌───────────────────────────┐   │
│  │     Auth     │  │        PostgreSQL          │   │
│  │              │  │                           │   │
│  │ Email/senha  │  │  hosts                    │   │
│  │ por anfitrião│  │  guide_content (JSONB)    │   │
│  └──────────────┘  └───────────────────────────┘   │
│                                                     │
│  Row Level Security — cada anfitrião acessa         │
│  apenas seus próprios dados                         │
└─────────────────────────────────────────────────────┘
```

### Banco de dados

**`hosts`** — perfil de cada anfitrião  
`id · email · owner_name · property_name · slug · is_admin`

**`guide_content`** — conteúdo completo do guia  
`property_name · welcome_message · address · maps_url · checkin_time · checkout_time · wifi_name · wifi_password · wifi_qr_url · hero_image_url · restaurants · markets · pharmacies · activities · gyms · emergency · rules`

As colunas de listas (`restaurants`, `markets` etc.) são **JSONB**, permitindo que cada anfitrião adicione quantos itens quiser sem alterar o schema.

---

## Funcionalidades

### Guia do Hóspede
- Hero section estilo Netflix com foto da propriedade e gradiente cinemático
- Cards de check-in, check-out, Wi-Fi e suporte
- Seção de Wi-Fi com senha visível e QR code para conexão automática
- Mapa incorporado e link direto para o Google Maps
- Seções de indicações: restaurantes, mercados, farmácias, atividades, academias, emergência
- Regras da casa
- Animações CSS: chuva animada nos cards de clima, sol girando, estrelas piscando
- Conteúdo carregado dinamicamente via Supabase com `?h=slug`

### Painel do Anfitrião
- Autenticação via Supabase Auth (e-mail e senha)
- Editor dividido em seções: Geral, Propriedade, Apresentação, Wi-Fi, e todas as listas de indicações
- Gerenciamento de listas com adicionar, editar e remover itens
- Slug único por anfitrião — gera o link do guia automaticamente
- Preview do guia em tempo real

### Painel de Administração
- Visão geral de todos os anfitriões cadastrados
- Estatísticas: total de anfitriões, guias configurados, última atualização
- Edição do guia de qualquer anfitrião
- Remoção de anfitriões
- Acesso restrito por flag `is_admin` verificada via função SQL `SECURITY DEFINER`

### Segurança
- Row Level Security (RLS) em todas as tabelas
- Cada anfitrião acessa e edita **apenas seus próprios dados**
- Hóspedes têm acesso de leitura pública sem autenticação
- Admin verificado por função PostgreSQL que evita recursão no RLS
- Nenhuma chave sensível exposta — apenas a `anon key` pública do Supabase (design intencional)

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 / CSS3 / JavaScript | Frontend sem framework |
| Tailwind CSS (CDN) | Estilização e responsividade |
| Supabase Auth | Autenticação dos anfitriões |
| Supabase PostgreSQL | Banco de dados multi-tenant |
| Row Level Security | Isolamento de dados por anfitrião |
| Google Fonts | Dancing Script · DM Serif Display · Nunito Sans |
| Material Icons | Ícones da interface |

---

## Como Configurar

### 1. Banco de dados
Execute `SETUP_SUPABASE.sql` no SQL Editor do seu projeto Supabase.

### 2. Permissões de admin
Execute `ADMIN_SETUP.sql` após criar sua conta, substituindo o e-mail pelo seu.

### 3. Deploy
Faça o upload da pasta no [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) — são arquivos estáticos, sem necessidade de servidor.

### 4. Primeiro acesso
Acesse `login.html`, entre com sua conta e configure seu guia no `painel.html`.

---

## Fluxo de Uso

```
Administrador cria conta do anfitrião no Supabase Auth
        ↓
Anfitrião acessa login.html → painel.html
        ↓
Define slug, preenche conteúdo (Wi-Fi, endereço, indicações...)
        ↓
Compartilha com hóspedes: seusite.com/guia.html?h=seu-slug
        ↓
Hóspede acessa o guia sem login, em qualquer dispositivo
```

---

## Estrutura de Arquivos

```
├── index.html          # Guia pessoal (vitrine)
├── login.html          # Autenticação de anfitriões
├── painel.html         # Editor do guia
├── admin.html          # Painel administrativo
├── guia.html           # Template dinâmico para hóspedes
├── SETUP_SUPABASE.sql  # Schema inicial do banco
├── ADMIN_SETUP.sql     # Configuração de permissões admin
└── assets/             # Imagens da propriedade
```
=======
# natal-airbnb-guide
Site para hóspedes do Airbnb com regras, WiFi, locais próximos, fotos, localização e avaliações.
>>>>>>> fb0f7d38e059cd905b9709c1549ee8eebe5e9d6d
