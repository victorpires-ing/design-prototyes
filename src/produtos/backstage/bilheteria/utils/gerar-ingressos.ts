import { jsPDF } from "jspdf";
import ticketArt from "../assets/ticket-art.webp";
import type { Pedido } from "../data/pedidos";

/**
 * Geração dos arquivos de ingresso do pedido.
 *
 * PDF: uma página A4 por unidade comprada, reproduzindo o modelo de impressão
 * de `pages/IngressoPdf.tsx`. CSV: uma linha por unidade, para conferência.
 */

const EVENT_NAME = "América x Laguna (5 a 0)";
const EVENT_DATE = "21 JUN";
const EVENT_TIME = "14:00";
const EVENT_ADDRESS = "Arena das Dunas • Natal, RN";
const PRODUCER = "Ingresse";

/** Margem esquerda e topo do conteúdo, em pontos (A4 = 595 x 842). */
const X = 61;
const TOP = 88;
const COL = 178;

export interface TicketUnit {
    /** Posição da unidade dentro do pedido, começando em 1. */
    sequencia: number;
    /** Conteúdo do código QR do ingresso. */
    codigo: string;
    itemName: string;
    itemSubtitle?: string;
    /** Lote do ingresso — vazio para produtos e combos. */
    lote?: string;
}

/** Expande os itens do pedido em uma unidade por ingresso impresso. */
export function ticketUnits(pedido: Pedido): TicketUnit[] {
    const base = pedido.id.replace(/-/g, "").toUpperCase();
    let sequencia = 0;

    return pedido.itens.flatMap((item) =>
        Array.from({ length: Math.max(1, item.quantity) }, () => {
            sequencia += 1;
            return {
                sequencia,
                codigo: `${base.slice(0, 12)}${sequencia.toString().padStart(4, "0")}`,
                itemName: item.name,
                itemSubtitle: item.subtitle,
                lote: item.lote,
            };
        }),
    );
}

/* ------------------------------------------------------------------ */
/*  PDF                                                                */
/* ------------------------------------------------------------------ */

/** Retângulos do QR fictício — mesmo padrão determinístico da pré-visualização. */
const qrCells = (seed: number) => Array.from({ length: 100 }, (_, index) => (index * 7 + (index % 5) * 13 + seed) % 3 !== 0);

/** Resolução da arte no PDF — 4x a largura impressa (178pt), ~288 dpi. */
const ART_SCALE = 4;

/**
 * Carrega a arte do ingresso e reamostra num canvas.
 *
 * A arte é bitmap porque o fundo tem um shader que não sobrevive à exportação
 * em SVG. O WebP não entra direto num PDF, mas o navegador decodifica e o
 * jsPDF aceita o canvas — que ainda por cima sai na resolução de impressão.
 */
function loadTicketArt(): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = COL * ART_SCALE;
            canvas.height = Math.round((canvas.width * image.naturalHeight) / image.naturalWidth);
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas indisponível para rasterizar a arte do ingresso"));
                return;
            }
            // Achata sobre branco: o papel já é branco e o JPEG (sem alpha) deixa o PDF bem menor.
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas);
        };
        image.onerror = () => reject(new Error("Não foi possível carregar a arte do ingresso"));
        image.src = ticketArt;
    });
}

function drawQr(doc: jsPDF, x: number, y: number, seed: number) {
    const size = 40;
    const cell = size / 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, size, size, "F");
    doc.setFillColor(0, 0, 0);
    qrCells(seed).forEach((filled, index) => {
        if (!filled) return;
        doc.rect(x + (index % 10) * cell, y + Math.floor(index / 10) * cell, cell, cell, "F");
    });
}

function drawPage(doc: jsPDF, pedido: Pedido, ticket: TicketUnit, art: HTMLCanvasElement) {
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const nameLines = doc.splitTextToSize(EVENT_NAME, COL - 46) as string[];
    doc.text(nameLines, X, TOP);

    doc.setFontSize(11);
    doc.text(EVENT_DATE, X + COL, TOP, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(EVENT_TIME, X + COL, TOP + 11, { align: "right" });

    let y = TOP + nameLines.length * 15 + 4;

    doc.setFontSize(8);
    doc.text(ticket.itemName, X, y);
    y += 11;
    if (ticket.itemSubtitle) {
        doc.text(ticket.itemSubtitle, X, y);
        y += 11;
    }
    doc.text(EVENT_ADDRESS, X, y);

    y += 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(PRODUCER, X, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text(ticket.codigo, X, y + 9);

    // A arte mantém a proporção do arquivo, então trocar o PNG não quebra o layout.
    const artY = y + 34;
    const artHeight = (COL * art.height) / art.width;
    // O alias faz o jsPDF reaproveitar a mesma imagem em todas as páginas.
    doc.addImage(art, "JPEG", X, artY, COL, artHeight, "ticket-art", "FAST");

    const infoY = artY + artHeight + 12;
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA COMPRA", X, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(pedido.dataVendaLabel, X, infoY + 8);
    doc.text(pedido.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), X, infoY + 16);
    doc.text(pedido.destinatario, X, infoY + 24);

    doc.setFont("helvetica", "bold");
    doc.text("SEQUÊNCIA", X + 78, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(String(ticket.sequencia), X + 78, infoY + 8);

    drawQr(doc, X + COL - 40, infoY - 6, ticket.sequencia);

    doc.setFont("helvetica", "bold");
    doc.text("PEDIDO", X, infoY + 48);
    doc.setFont("helvetica", "normal");
    doc.text(pedido.id, X, infoY + 56);
}

export async function gerarIngressosPdf(pedido: Pedido) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const art = await loadTicketArt();

    ticketUnits(pedido).forEach((ticket, index) => {
        if (index > 0) doc.addPage();
        drawPage(doc, pedido, ticket, art);
    });

    doc.save(`ingressos-${pedido.id.slice(0, 8)}.pdf`);
}

/* ------------------------------------------------------------------ */
/*  CSV                                                                */
/* ------------------------------------------------------------------ */

const CSV_COLUMNS = ["sequência", "código QR", "pedido", "item", "lote"];

const escapeCell = (value: string) => (/[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function gerarIngressosCsv(pedido: Pedido) {
    // "item" junta nome e grupo/sessão — é como o operador reconhece a linha na planilha.
    const rows = ticketUnits(pedido).map((ticket) => [
        String(ticket.sequencia),
        ticket.codigo,
        pedido.id,
        [ticket.itemName, ticket.itemSubtitle].filter(Boolean).join(" — "),
        ticket.lote ?? "—",
    ]);

    // `;` como separador e BOM para o Excel em pt-BR abrir o arquivo corretamente.
    const csv = [CSV_COLUMNS, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingressos-${pedido.id.slice(0, 8)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
