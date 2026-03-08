import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  File,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { uploadFile } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SUPPORTED_FORMATS = [
  { 
    name: "CSV", 
    extension: ".csv", 
    icon: FileSpreadsheet, 
    description: "Comma-separated values" 
  },
  { 
    name: "Excel", 
    extension: ".xlsx, .xls", 
    icon: FileSpreadsheet, 
    description: "Microsoft Excel spreadsheet" 
  },
  { 
    name: "PDF", 
    extension: ".pdf", 
    icon: FileText, 
    description: "Bank statement PDF (basic extraction)" 
  },
];

export const ImportData = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Unsupported file format. Please upload CSV, Excel, or PDF files.");
      return;
    }
    
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadResult(null);
    
    try {
      const result = await uploadFile(selectedFile);
      setUploadResult({
        success: true,
        message: result.message,
        count: result.transactions_count,
        anomalies: result.anomalies_detected
      });
      toast.success(result.message);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || "Failed to upload file"
      });
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleViewTransactions = () => {
    navigate('/transactions');
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="import-data-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">
          Upload your financial data files to get started
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="chart-container" data-testid="upload-zone-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadResult ? (
            <>
              <div
                className={`upload-zone ${isDragging ? 'dragover' : ''} ${selectedFile ? 'border-primary' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                data-testid="upload-dropzone"
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  data-testid="file-input"
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <File className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-medium text-lg">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleUpload} 
                        disabled={uploading}
                        data-testid="upload-btn"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload & Process
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetUpload}>
                        Choose Different File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-lg mb-2">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV, Excel, and PDF files
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8" data-testid="upload-result">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${uploadResult.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {uploadResult.success ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {uploadResult.success ? 'Import Successful!' : 'Import Failed'}
              </h3>
              <p className="text-muted-foreground mb-2">{uploadResult.message}</p>
              
              {uploadResult.success && (
                <div className="flex justify-center gap-6 my-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono text-primary">{uploadResult.count}</p>
                    <p className="text-muted-foreground">Transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono text-yellow-500">{uploadResult.anomalies}</p>
                    <p className="text-muted-foreground">Anomalies</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center gap-3 mt-6">
                {uploadResult.success ? (
                  <>
                    <Button onClick={handleViewTransactions} data-testid="view-transactions-btn">
                      View Transactions
                    </Button>
                    <Button variant="outline" onClick={resetUpload}>
                      Upload Another File
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={resetUpload}>
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUPPORTED_FORMATS.map((format) => (
          <Card key={format.name} className="bg-card border-border" data-testid={`format-${format.name.toLowerCase()}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <format.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{format.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{format.extension}</p>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips */}
      <Card className="bg-card border-border" data-testid="import-tips">
        <CardHeader>
          <CardTitle className="text-lg">Import Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>CSV and Excel files should have columns for Date, Description, and Amount</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Negative amounts are automatically classified as expenses</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Transactions are automatically categorized based on description keywords</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Unusual transactions are flagged as anomalies for your review</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>PDF extraction is basic - for best results, use CSV or Excel exports from your bank</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportData;
