import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  Packer,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Parses Tiptap DOM / JSON content and converts it to a professional .docx manuscript.
 * Matches standard manuscript formatting: 1-inch margins, Times New Roman 12pt, double spacing.
 */
export const exportToDocx = async (editor, title = 'Manuscript') => {
  if (!editor) return;

  const docNodes = editor.getJSON().content || [];
  const docxParagraphs = [];

  for (const node of docNodes) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const text = node.content?.map((c) => c.text || '').join('') || '';
      const align = node.attrs?.textAlign;

      let docxAlign = AlignmentType.LEFT;
      if (align === 'center') docxAlign = AlignmentType.CENTER;
      if (align === 'right') docxAlign = AlignmentType.RIGHT;
      if (align === 'justify') docxAlign = AlignmentType.JUSTIFIED;

      let headingLevel = HeadingLevel.HEADING_1;
      let fontSize = 32; // half-points: 32 = 16pt
      if (level === 2) {
        headingLevel = HeadingLevel.HEADING_2;
        fontSize = 28; // 14pt
      } else if (level === 3) {
        headingLevel = HeadingLevel.HEADING_3;
        fontSize = 24; // 12pt
      }

      docxParagraphs.push(
        new Paragraph({
          text,
          heading: headingLevel,
          alignment: docxAlign,
          spacing: {
            before: 240, // 12pt
            after: 240,
            line: 480, // double line spacing
          },
          run: {
            font: 'Times New Roman',
            bold: true,
            size: fontSize,
          },
        })
      );
    } else if (node.type === 'paragraph') {
      const align = node.attrs?.textAlign;
      let docxAlign = AlignmentType.LEFT;
      if (align === 'center') docxAlign = AlignmentType.CENTER;
      if (align === 'right') docxAlign = AlignmentType.RIGHT;
      if (align === 'justify') docxAlign = AlignmentType.JUSTIFIED;

      const runs = [];
      if (node.content && node.content.length > 0) {
        for (const child of node.content) {
          if (child.type === 'text') {
            const marks = child.marks || [];
            const isBold = marks.some((m) => m.type === 'bold');
            const isItalic = marks.some((m) => m.type === 'italic');
            const isUnderline = marks.some((m) => m.type === 'underline');
            const isStrike = marks.some((m) => m.type === 'strike');

            runs.push(
              new TextRun({
                text: child.text || '',
                font: 'Times New Roman',
                size: 24, // 12pt
                bold: isBold,
                italics: isItalic,
                underline: isUnderline ? {} : undefined,
                strike: isStrike,
              })
            );
          }
        }
      } else {
        // Empty paragraph for spacing
        runs.push(new TextRun({ text: '', size: 24 }));
      }

      docxParagraphs.push(
        new Paragraph({
          children: runs,
          alignment: docxAlign,
          spacing: {
            line: 480, // double spacing
            after: 0,
          },
        })
      );
    } else if (node.type === 'callout') {
      const calloutText = node.content
        ?.map((p) => p.content?.map((c) => c.text || '').join('') || '')
        .join('\n') || '';

      docxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[NOTE]: ${calloutText}`,
              italics: true,
              font: 'Times New Roman',
              size: 22,
            }),
          ],
          spacing: { before: 180, after: 180, line: 360 },
        })
      );
    } else if (node.type === 'table') {
      const rows = [];
      for (const rowNode of node.content || []) {
        const cells = [];
        for (const cellNode of rowNode.content || []) {
          const cellText = cellNode.content
            ?.map((p) => p.content?.map((c) => c.text || '').join('') || '')
            .join(' ') || '';

          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cellText, font: 'Times New Roman', size: 22 })],
                }),
              ],
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
            })
          );
        }
        rows.push(new TableRow({ children: cells }));
      }

      docxParagraphs.push(
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: docxParagraphs.length > 0 ? docxParagraphs : [new Paragraph({ text: '' })],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.docx`);
};

export const exportToHtmlFile = (html, title = 'Manuscript') => {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 2.0;
    margin: 1in;
    color: #111;
  }
  p { margin-bottom: 0; }
  .ql-align-center { text-align: center; }
  .ql-align-right { text-align: right; }
  .ql-align-justify { text-align: justify; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.html`);
};

export const exportToMarkdownFile = (editor, title = 'Manuscript') => {
  if (!editor) return;
  const nodes = editor.getJSON().content || [];
  let md = '';

  for (const node of nodes) {
    if (node.type === 'heading') {
      const hashes = '#'.repeat(node.attrs?.level || 1);
      const text = node.content?.map((c) => c.text || '').join('') || '';
      md += `${hashes} ${text}\n\n`;
    } else if (node.type === 'paragraph') {
      const text = node.content?.map((c) => c.text || '').join('') || '';
      md += `${text}\n\n`;
    } else if (node.type === 'bulletList') {
      for (const item of node.content || []) {
        const itemText = item.content
          ?.map((p) => p.content?.map((c) => c.text || '').join('') || '')
          .join(' ') || '';
        md += `- ${itemText}\n`;
      }
      md += '\n';
    } else if (node.type === 'orderedList') {
      let idx = 1;
      for (const item of node.content || []) {
        const itemText = item.content
          ?.map((p) => p.content?.map((c) => c.text || '').join('') || '')
          .join(' ') || '';
        md += `${idx}. ${itemText}\n`;
        idx++;
      }
      md += '\n';
    } else if (node.type === 'callout') {
      const calloutText = node.content
        ?.map((p) => p.content?.map((c) => c.text || '').join('') || '')
        .join('\n') || '';
      md += `> [!NOTE]\n> ${calloutText}\n\n`;
    }
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`);
};
