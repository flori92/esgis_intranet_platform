let pdfLibPromise;

export const loadPdfLib = async () => {
  if (!pdfLibPromise) {
    pdfLibPromise = import('pdf-lib');
  }

  return pdfLibPromise;
};
