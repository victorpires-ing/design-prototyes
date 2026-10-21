/* ------------------------------------------------------------------ */
/*  Grupos de Membros (mock). Na plataforma vêm da área de Membros;    */
/*  aqui é uma listagem de exemplo. Ao escolher um grupo, os e-mails   */
/*  dele viram os operadores do grupo de cotas.                        */
/* ------------------------------------------------------------------ */

export interface GrupoMembros {
    id: string;
    nome: string;
    emails: string[];
}

const emails = (dominio: string, nomes: string[]) => nomes.map((n) => `${n}@${dominio}`);

export const GRUPOS_MEMBROS: GrupoMembros[] = [
    {
        id: "m-bilheteria",
        nome: "Equipe de bilheteria",
        emails: emails("casamarceneiro.com.br", ["ana.lima", "bruno.costa", "carla.mendes", "diego.rocha", "elisa.prado", "felipe.nunes"]),
    },
    {
        id: "m-promoters",
        nome: "Promoters",
        emails: emails("gmail.com", ["gabi.promo", "henrique.eventos", "isa.noite", "joao.vip", "karen.lista", "leo.festas", "marina.rp", "nando.promo"]),
    },
    {
        id: "m-camarote",
        nome: "Atendimento Camarote",
        emails: emails("casamarceneiro.com.br", ["otavio.reis", "paula.santos", "rafael.dias", "sofia.alves"]),
    },
    {
        id: "m-producao",
        nome: "Produção",
        emails: emails("producao.com.br", ["tiago.moura", "ursula.melo", "vitor.lopes", "wanda.ribeiro", "yuri.campos"]),
    },
    {
        id: "m-pdv",
        nome: "PDV Portaria",
        emails: emails("casamarceneiro.com.br", ["adriana.pdv", "beto.pdv", "cris.pdv", "davi.pdv", "edu.pdv", "fabi.pdv", "gui.pdv"]),
    },
    {
        id: "m-hostess",
        nome: "Hostess",
        emails: emails("gmail.com", ["helena.host", "iara.host", "julia.host"]),
    },
    {
        id: "m-bar",
        nome: "Bar Central",
        emails: emails("casamarceneiro.com.br", ["kleber.bar", "luana.bar", "mateus.bar", "nina.bar", "orlando.bar"]),
    },
    {
        id: "m-seguranca",
        nome: "Segurança",
        emails: emails("seguranca.com.br", ["pedro.seg", "quiteria.seg", "renan.seg", "silvia.seg", "tadeu.seg", "valeria.seg", "wesley.seg", "xavier.seg", "yara.seg"]),
    },
    {
        id: "m-credenciamento",
        nome: "Credenciamento",
        emails: emails("producao.com.br", ["amanda.cred", "breno.cred", "caio.cred", "daniela.cred"]),
    },
    {
        id: "m-influenciadores",
        nome: "Influenciadores",
        emails: emails("gmail.com", ["bia.vibes", "duda.roles", "enzo.night", "fefe.agenda", "gui.festeiro", "lari.eventos"]),
    },
    {
        id: "m-imprensa",
        nome: "Imprensa",
        emails: emails("redacao.com.br", ["carlos.jornal", "denise.revista", "erick.portal"]),
    },
    {
        id: "m-patrocinadores",
        nome: "Patrocinadores",
        emails: emails("parceiros.com.br", ["fabio.marca", "gisele.marca", "heitor.marca", "ingrid.marca", "jonas.marca", "kelly.marca", "lucas.marca"]),
    },
    {
        id: "m-artistas",
        nome: "Artistas e banda",
        emails: emails("producao.com.br", ["mano.vocal", "nara.guitarra", "otto.bateria", "priscila.baixo"]),
    },
    {
        id: "m-backstage",
        nome: "Backstage",
        emails: emails("producao.com.br", ["rodrigo.palco", "samara.palco", "tulio.palco", "vanessa.palco", "william.palco", "zeca.palco"]),
    },
    {
        id: "m-vip",
        nome: "Lista VIP",
        emails: emails("gmail.com", ["alice.vip", "bernardo.vip", "cecilia.vip", "davi.vip", "eloisa.vip", "fabricio.vip", "giovana.vip", "hugo.vip", "isis.vip", "joaquim.vip"]),
    },
    {
        id: "m-staff-extra",
        nome: "Staff extra",
        emails: emails("gmail.com", ["kaio.staff", "lia.staff"]),
    },
];

export const GRUPO_MEMBROS_POR_ID: Record<string, GrupoMembros> = Object.fromEntries(GRUPOS_MEMBROS.map((g) => [g.id, g]));
