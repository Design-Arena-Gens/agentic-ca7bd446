import pdfParse from 'pdf-parse';
import JSZip from 'jszip';

export class FileProcessor {
  static async processFile(fileData: Buffer, fileType: string): Promise<string> {
    try {
      if (fileType === 'application/pdf' || fileType === 'pdf') {
        return await this.processPDF(fileData);
      } else if (fileType === 'application/zip' || fileType === 'zip') {
        return await this.processZIP(fileData);
      } else if (fileType === 'text/plain' || fileType === 'txt') {
        return fileData.toString('utf-8');
      } else {
        return fileData.toString('utf-8');
      }
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error('Failed to process file');
    }
  }

  static async processPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse PDF');
    }
  }

  static async processZIP(buffer: Buffer): Promise<string> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      let content = '';

      for (const filename in zip.files) {
        const file = zip.files[filename];
        if (!file.dir) {
          if (filename.endsWith('.txt') || filename.endsWith('.md')) {
            const text = await file.async('string');
            content += `\n\n--- ${filename} ---\n${text}`;
          } else if (filename.endsWith('.pdf')) {
            const pdfBuffer = await file.async('nodebuffer');
            const text = await this.processPDF(pdfBuffer);
            content += `\n\n--- ${filename} ---\n${text}`;
          }
        }
      }

      return content || 'No readable content found in ZIP file';
    } catch (error) {
      throw new Error('Failed to process ZIP file');
    }
  }

  static async fetchFromS3(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file from S3');
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error('Failed to fetch file from S3 URL');
    }
  }
}
