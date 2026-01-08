import { Upload } from "lucide-react";
import React from "react";

interface FileImportProps {
  onImport: (file: File) => void;
  title?: string;
  description?: string;
}

const FileImport: React.FC<FileImportProps> = ({ onImport, title, description }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <label className="bg-card border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-10 cursor-pointer hover:border-primary transition-colors shadow-sm">
        <div className="p-3 bg-primary/10 rounded-full border-4 border-primary/20 mb-4">
            <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="font-semibold text-foreground">{title || "Importar Base de Dados"}</p>
        <p className="text-sm text-muted-foreground">{description || "Arraste ou clique para carregar o arquivo .xlsx"}</p>
        <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
        />
    </label>
  );
};

export default FileImport;
