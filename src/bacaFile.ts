// ============================================================
// Pembaca file di sisi browser.
// Mengubah PDF / Word / Excel / PowerPoint / teks jadi teks biasa
// supaya bisa dibaca AI (tanpa perlu server).
// ============================================================

import { unzipSync, strFromU8 } from "fflate";

/** Ambil teks dari XML sederhana (buang tag). */
function teksDariXml(xml: string): string {
  return xml
    .replace(/<w:p[ >]/g, "\n<w:p ") // paragraf Word
    .replace(/<a:p>/g, "\n<a:p>") // paragraf PowerPoint
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Word .docx → teks */
async function bacaDocx(data: Uint8Array): Promise<string> {
  const zip = unzipSync(data);
  const isi = zip["word/document.xml"];
  if (!isi) throw new Error("Struktur .docx tidak dikenali.");
  return teksDariXml(strFromU8(isi));
}

/** PowerPoint .pptx → teks per slide */
async function bacaPptx(data: Uint8Array): Promise<string> {
  const zip = unzipSync(data);
  const slide = Object.keys(zip)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort((a, b) => {
      const na = Number(a.match(/(\d+)/)?.[1] ?? 0);
      const nb = Number(b.match(/(\d+)/)?.[1] ?? 0);
      return na - nb;
    });
  const bagian: string[] = [];
  slide.forEach((k, i) => {
    const t = teksDariXml(strFromU8(zip[k]));
    if (t) bagian.push(`--- Slide ${i + 1} ---\n${t}`);
  });
  if (!bagian.length) throw new Error("Tidak ada teks di .pptx.");
  return bagian.join("\n\n");
}

/** Excel .xlsx → teks (baris & kolom) */
async function bacaXlsx(data: Uint8Array): Promise<string> {
  const zip = unzipSync(data);

  // sharedStrings.xml berisi semua teks yang dipakai sel
  const shared: string[] = [];
  const ss = zip["xl/sharedStrings.xml"];
  if (ss) {
    const xml = strFromU8(ss);
    const cocok = xml.match(/<si>[\s\S]*?<\/si>/g) ?? [];
    for (const si of cocok) {
      const t = si
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
      shared.push(t);
    }
  }

  const sheet = Object.keys(zip)
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort();
  const barisSemua: string[] = [];
  sheet.forEach((k) => {
    const xml = strFromU8(zip[k]);
    const baris = xml.match(/<row[\s\S]*?<\/row>/g) ?? [];
    for (const r of baris) {
      const sel = r.match(/<c[\s\S]*?<\/c>/g) ?? [];
      const nilai = sel.map((c) => {
        const t = c.match(/t="([^"]+)"/)?.[1];
        const v = c.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        const inline = c.match(/<is>[\s\S]*?<\/is>/)?.[0] ?? "";
        if (inline) return inline.replace(/<[^>]+>/g, "").trim();
        if (t === "s") return shared[Number(v)] ?? "";
        return v;
      });
      const bersih = nilai.filter((x) => x !== "").join(" | ");
      if (bersih) barisSemua.push(bersih);
    }
  });
  if (!barisSemua.length) throw new Error("Tidak ada data di .xlsx.");
  return barisSemua.join("\n");
}

/** PDF → teks (pakai pdf.js) */
async function bacaPdf(data: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data }).promise;
  const maks = Math.min(doc.numPages, 30); // batasi 30 halaman
  const bagian: string[] = [];
  for (let i = 1; i <= maks; i++) {
    const hal = await doc.getPage(i);
    const isi = await hal.getTextContent();
    const t = isi.items
      .map((it: any) => it.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (t) bagian.push(`--- Halaman ${i} ---\n${t}`);
  }
  if (!bagian.length) throw new Error("PDF tidak berisi teks (mungkin hasil scan).");
  return bagian.join("\n\n");
}

/** Tentukan jenis file dari nama & MIME. */
export function jenisFile(nama: string, tipe: string): "gambar" | "teks" | "dokumen" | null {
  const n = nama.toLowerCase();
  if (tipe.startsWith("image/")) return "gambar";
  if (/\.(pdf)$/.test(n)) return "dokumen";
  if (/\.(docx|doc)$/.test(n)) return "dokumen";
  if (/\.(pptx|ppt)$/.test(n)) return "dokumen";
  if (/\.(xlsx|xls|csv)$/.test(n)) return "dokumen";
  if (
    tipe.startsWith("text/") ||
    /\.(txt|md|json|js|ts|tsx|jsx|py|html|css|log|xml|yml|yaml|sql|java|c|cpp|go|rs)$/.test(n)
  )
    return "teks";
  return null;
}

/** Baca file jadi teks (untuk PDF/Word/Excel/PPT/teks). */
export async function bacaJadiTeks(file: File): Promise<string> {
  const n = file.name.toLowerCase();
  const buf = new Uint8Array(await file.arrayBuffer());

  if (/\.(docx)$/.test(n)) return bacaDocx(buf);
  if (/\.(pptx)$/.test(n)) return bacaPptx(buf);
  if (/\.(xlsx)$/.test(n)) return bacaXlsx(buf);
  if (/\.(pdf)$/.test(n)) return bacaPdf(buf);

  // .doc / .ppt / .xls lama (format biner) tidak didukung
  if (/\.(doc|ppt|xls)$/.test(n)) {
    throw new Error(
      "Format lama (.doc/.ppt/.xls) belum didukung. Simpan ulang sebagai .docx/.pptx/.xlsx ya.",
    );
  }

  return file.text();
}
