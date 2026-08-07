/**
 * @file csv-exporter.service.ts
 * @layer Infrastructure › Services
 *
 * Provides safe JSON array to CSV string conversion with CSV Injection prevention.
 */

export class CsvExporterService {
  /**
   * Sanitizes cell string value to prevent CSV / Formula Injection in Excel/Google Sheets.
   * Values starting with =, +, -, @, \t, \r are prepended with a single quote (').
   */
  private static sanitizeCell(val: any): string {
    if (val === null || val === undefined) {
      return '';
    }

    let stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);

    // Escape double quotes by doubling them
    stringVal = stringVal.replace(/"/g, '""');

    // Formula injection check
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some((prefix) => stringVal.startsWith(prefix))) {
      stringVal = `'${stringVal}`;
    }

    // Wrap in double quotes if it contains commas, newlines, or quotes
    if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
      return `"${stringVal}"`;
    }

    return stringVal;
  }

  /**
   * Converts an array of objects into a CSV formatted string.
   */
  public static jsonToCsv<T extends Record<string, any>>(data: T[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const headerLine = headers.map(this.sanitizeCell).join(',');

    const rowLines = data.map((row) =>
      headers.map((header) => this.sanitizeCell(row[header])).join(',')
    );

    return [headerLine, ...rowLines].join('\r\n');
  }
}
