// Word Craft - Client-side Microsoft Word (.docx) Parser

class DocxReader {
  constructor() {
    this.mammothLoaded = false;
  }

  init() {
    if (window.mammoth) {
      this.mammothLoaded = true;
    }
  }

  /**
   * Reads a .docx file and returns its plain text content.
   * @param {File} file - The file object from a file input or drag-and-drop event.
   * @returns {Promise<string>} - The extracted plain text.
   */
  async read(file) {
    this.init();
    if (!this.mammothLoaded) {
      throw new Error("Mammoth library is not loaded. Please check your internet connection.");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          
          if (result && result.value !== undefined) {
            resolve(result.value);
          } else {
            reject(new Error("Could not extract any readable text from the document."));
          }
        } catch (error) {
          reject(new Error("Failed to parse Word document: " + error.message));
        }
      };
      reader.onerror = () => {
        reject(new Error("Error reading file."));
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

const docxReader = new DocxReader();
