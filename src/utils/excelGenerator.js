// src/utils/excelGenerator.js

import ExcelJS from 'exceljs';
import { encode as btoa } from 'base-64';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper: build ISO dates between start and end (inclusive)
function getDatesInRange(startIso, endIso) {
  const dates = [];
  let cur = new Date(startIso);
  const end = new Date(endIso);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]); // "YYYY-MM-DD"
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Convert Uint8Array to Base64
function uint8ToBase64(u8Arr) {
  let binary = '';
  u8Arr.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export async function generateExpenseExcel(tripData, userName, tripName, purpose) {
  // Derive trip start/end from data
  const isos = tripData.map(e => e.date.split('T')[0]).sort();
  const startIso = isos[0];
  const endIso = isos[isos.length - 1];
  const dates = getDatesInRange(startIso, endIso);
  const days = dates.length;

  // Create workbook and worksheet
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Travel Expense Report', {
    views: [{ state: 'frozen', ySplit: 8 }],
  });

  // Set column widths
  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 35;
  ws.getColumn(3).width = 18;
  for (let i = 0; i < days; i++) ws.getColumn(4 + i).width = 12;
  ws.getColumn(4 + days).width = 18;
  ws.getColumn(5 + days).width = 18;

  // Styles
  const boldFont = { bold: true };
  const centerAlign = { horizontal: 'center', vertical: 'middle' };
  const leftAlign = { horizontal: 'left', vertical: 'middle' };
  const dottedFill = { type: 'pattern', pattern: 'darkVertical', fgColor: { argb: 'DDDDDD' } };

  // 1. Title row
  ws.mergeCells(1, 1, 1, 5 + days);
  const title = ws.getCell(1, 1);
  title.value = 'Grinnell College Travel Expense Report';
  title.font = boldFont;
  title.alignment = centerAlign;
  title.fill = dottedFill;

  // Helper for header rows
  function fillHeaderRow(row, leftText, rightText) {
    const mid = Math.floor((5 + days) / 2);
    ws.mergeCells(row, 1, row, mid);
    const leftCell = ws.getCell(row, 1);
    leftCell.value = leftText;
    leftCell.font = boldFont;
    leftCell.alignment = leftAlign;
    ws.mergeCells(row, mid + 1, row, 5 + days);
    const rightCell = ws.getCell(row, mid + 1);
    rightCell.value = rightText;
    rightCell.font = boldFont;
    rightCell.alignment = leftAlign;
  }

  // 2-4. Header Rows
  fillHeaderRow(2, `Traveler Name: ${userName}`, `Trip To: ${tripName}`);
  const pCard = (await AsyncStorage.getItem('userPCard')) || '';
  fillHeaderRow(3, `P-Card: ${pCard}`, `Purpose: ${purpose}`);
  const dept = (await AsyncStorage.getItem('userDept')) || '';
  fillHeaderRow(4,
    `Traveler Address/Dept: ${dept}`,
    `Dates: ${new Date(startIso).toLocaleDateString()} - ${new Date(endIso).toLocaleDateString()}`
  );

  // 5-7. Itinerary
  [5, 6, 7].forEach(r => ws.mergeCells(r, 1, r, 2));
  const itinCell = ws.getCell(5, 1);
  itinCell.value = 'Multiple location itinerary';
  itinCell.font = boldFont;
  itinCell.alignment = centerAlign;
  const dateHeader = ws.getCell(5, 3);
  dateHeader.value = 'DATE';
  dateHeader.font = boldFont;
  dateHeader.alignment = centerAlign;
  ['City', 'City'].forEach((txt, i) => {
    const cell = ws.getCell(6 + i, 3);
    cell.value = txt;
    cell.font = boldFont;
    cell.alignment = centerAlign;
  });
  // Dates in row 5
  dates.forEach((d, i) => {
    const c = ws.getCell(5, 4 + i);
    c.value = new Date(d).toLocaleDateString();
    c.alignment = centerAlign;
  });
  // College CC & Personal Payment
  const ccCol = 4 + days;
  const ppCol = ccCol + 1;
  ws.mergeCells(6, ccCol, 7, ccCol);
  const ccCell = ws.getCell(6, ccCol);
  ccCell.value = 'College Credit Card';
  ccCell.font = boldFont;
  ccCell.alignment = centerAlign;
  ws.mergeCells(6, ppCol, 7, ppCol);
  const ppCell = ws.getCell(6, ppCol);
  ppCell.value = 'Personal Payment';
  ppCell.font = boldFont;
  ppCell.alignment = centerAlign;

  // 6. Block row 8
  for (let c = 1; c <= 5 + days; c++) {
    ws.getRow(8).getCell(c).fill = dottedFill;
  }

  // 7. Rows 9-36: TRAVEL, MEALS, MISC
  'TRAVEL'.split('').forEach((ch, i) => {
    const cell = ws.getCell(9 + 2 * i, 1);
    cell.value = ch;
    cell.font = boldFont;
    cell.alignment = centerAlign;
  });
  'MEALS'.split('').forEach((ch, i) => {
    const cell = ws.getCell(27 + i, 1);
    cell.value = ch;
    cell.font = boldFont;
    cell.alignment = centerAlign;
  });
  'MISC'.split('').forEach((ch, i) => {
    const cell = ws.getCell(33 + i, 1);
    cell.value = ch;
    cell.font = boldFont;
    cell.alignment = centerAlign;
  });

  // 8-9. Expense categories & payment types
  let cur = 9;
  const categories = [...new Set(tripData.map(e => e.category))];
  categories.forEach(cat => {
    // College CC row
    ws.mergeCells(cur, 2, cur + 1, 2);
    const catCell = ws.getCell(cur, 2);
    catCell.value = cat;
    catCell.font = boldFont;
    catCell.alignment = leftAlign;
    const ccType = ws.getCell(cur, 3);
    ccType.value = 'College CC';
    ccType.alignment = centerAlign;
    // Personal row
    const ppType = ws.getCell(cur + 1, 3);
    ppType.value = 'Personal Payment';
    ppType.alignment = centerAlign;
    cur += 2;
  });

  // 9. Row 37 blank (do nothing)

  // 10-18. Signatures, notes, totals, policy
  const blocks = [
    [38, 2, 39, 3, 'Employee Signature'],
    [38, 7, 39, 7, `Date: ${new Date().toLocaleDateString()}`],
    [40, 2, 41, 3, 'Approval Signature'],
    [42, 2, 43, 3, `Account Name: ${userName}`],
    [44, 2, 45, 3, 'Account Dept:'],
    [40, 7, 41, 7, 'Date:'],
    [42, 7, 43, 7, 'Account #:'],
    [44, 7, 45, 7, 'Account #:'],
  ];
  blocks.forEach(([r1, c1, r2, c2, txt]) => {
    ws.mergeCells(r1, c1, r2, c2);
    const cell = ws.getCell(r1, c1);
    cell.value = txt;
    cell.font = boldFont;
    cell.alignment = leftAlign;
  });

  // Notes I38-I44
  const notes = [
    'Please note if you had any of the following they must be included on this report:',
    '□  Airfare',
    '□  Ground Transportation',
    '□  Lodging',
    '□  All original receipts are preferred, $50 & over are required.',
    '□  Conference Registration',
    '□  If additional explanation is needed, use back of report.',
  ];
  notes.forEach((txt, i) => {
    const cell = ws.getCell(38 + i, 9);
    cell.value = txt;
    cell.alignment = leftAlign;
  });

  // Totals K38-L49
  const totals = [
    [38, 11, 39, 11, '$'],
    [38, 12, 39, 12, 'Total College Credit Card'],
    [40, 11, 41, 11, 'Total Personal Pymt'],
    [42, 11, 43, 11, 'Total Personal Cost'],
    [44, 11, 45, 11, 'Total Trip Cost'],
    [46, 11, 47, 11, 'Less advance 10-0000000-11202'],
    [48, 11, 49, 11, 'Balance Due to Employee/ (College)'],
  ];
  totals.forEach(([r1, c1, r2, c2, txt]) => {
    ws.mergeCells(r1, c1, r2, c2);
    const cell = ws.getCell(r1, c1);
    cell.value = txt;
    cell.font = boldFont;
    cell.alignment = leftAlign;
  });

  // Policy B46-H49
  ws.mergeCells(46, 2, 49, 8);
  const policyCell = ws.getCell(46, 2);
  policyCell.value =
    'PLEASE READ CAREFULLY: This report must be used when claiming reimbursement for expenses incurred on College business. The traveler should keep an accurate record of expenses and attach itemized receipts. If a travel advance has been issued, the amount should be noted.\nTHE COLLEGE DOES NOT REIMBURSE FOR EXPENSES OTHER THAN THOSE INCURRED IN THE COURSE OF OFFICIAL BUSINESS.';
  policyCell.alignment = leftAlign;

  // 19-30. Receipts, misc explanation, group meals (add merges & headers similarly)

  // Write to file and share
  const buf = await wb.xlsx.writeBuffer();
  const b64 = uint8ToBase64(new Uint8Array(buf));
  const fileName = `${userName}_${tripName}_Travel Expense Report.xlsx`;
  const fileUri = FileSystem.documentDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, b64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(fileUri);
}
