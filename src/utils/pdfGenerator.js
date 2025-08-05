// utils/pdfUtils.js

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Generates a multi-page PDF where each page shows one receipt image.
 * Inlines local JPGs as base64 so Expo Print can render them.
 *
 * @param {Array<Object>} rawExpenses
 *   Each object must have:
 *     - .date           (ISO string)
 *     - .receiptPhoto   (file:// URI)
 * @param {string} userName
 * @param {string} tripName
 * @returns {Promise<string>} URI of the saved PDF file
 */
export async function generateTripPdf(rawExpenses, userName, tripName) {
    // 1) sort expenses chronologically
    const sorted = rawExpenses.slice().sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // 2) build HTML pieces with inline base64 images
    const pagesHtml = await Promise.all(
        sorted.map(async (exp, idx) => {

            let uri = exp.receiptPhoto;
            if (!uri.startsWith('file://')) {
                uri = 'file://' + uri;
            }
            // read as base64
            const b64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const dateStr = new Date(exp.date).toLocaleDateString();
            return `
        <div style="page-break-after: always; text-align: center; font-family: sans-serif;">
          <h3>Receipt #${idx + 1} — ${dateStr}</h3>
          <img 
            src="data:image/jpeg;base64,${b64}" 
            style="max-width: 90%; height: auto; margin-top: 10px;"
          />
        </div>
      `;
        })
    );

    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${pagesHtml.join('')}
      </body>
    </html>
  `;

    // 3) generate PDF
    const { uri: tempUri } = await Print.printToFileAsync({ html });

    // 4) move to a nicer path if needed
    if (Platform.OS === 'android') {
        const dest = `${FileSystem.documentDirectory}${userName}_${tripName}.pdf`.replace(
            /\s+/g, '_'
        );
        await FileSystem.copyAsync({ from: tempUri, to: dest });
        return dest;
    }
    return tempUri;
}
