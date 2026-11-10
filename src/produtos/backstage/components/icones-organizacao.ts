import calendario from "@/assets/iconly/calendar.json";
import pessoas from "@/assets/iconly/users.json";
import carteira from "@/assets/iconly/wallet.json";
import carrinho from "@/assets/iconly/shopping-cart.json";
import sacola from "@/assets/iconly/bag.json";
import grupo from "@/assets/iconly/users-group.json";
import engrenagem from "@/assets/iconly/setting.json";
import adicionarPessoa from "@/assets/iconly/add-user.json";
import { iconeAnimado } from "@/components/foundations/icone-animado";

/* ------------------------------------------------------------------ */
/*  Ícones do menu da organização (UI-DS-008)                          */
/*                                                                     */
/*  Iconly Pro, animações em traço (estilo Light): Calendar (3133),    */
/*  users (3892), Wallet (2370), Shopping Cart (4040), bag (4088),     */
/*  users group (3996), Setting (2066), Add user (3894). Tocam uma     */
/*  vez no hover ou foco do item; com reduzir movimento, ficam parados.*/
/* ------------------------------------------------------------------ */

export const ICONES_ORGANIZACAO = {
    eventos: iconeAnimado(calendario),
    membros: iconeAnimado(pessoas),
    financas: iconeAnimado(carteira),
    pedidos: iconeAnimado(carrinho),
    produtos: iconeAnimado(sacola),
    publico: iconeAnimado(grupo),
    ajustes: iconeAnimado(engrenagem),
    permissao: iconeAnimado(adicionarPessoa),
};
