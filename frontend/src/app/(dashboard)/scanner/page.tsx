'use client';

/**
 * OCR Scanner Page
 * 
 * Capture or upload images to extract text using OCR.
 */

import { useState, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Copy, 
  Check, 
  Loader2, 
  X,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/AppShell';
import { AskAIPanel } from '@/components/common/AskAIPanel';
import { useOCRProcessor, useOCRStatus } from '@/lib/hooks/use-ocr';
import type { OCRResponse, StructuredNote } from '@/lib/types/ocr';

export default function ScannerPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: status } = useOCRStatus();
  const { processFile, isProcessing, reset } = useOCRProcessor();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Process file
    const ocrResult = await processFile(file);
    if (ocrResult) {
      setResult(ocrResult);
    }
  }, [processFile]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    
    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Process file
    const ocrResult = await processFile(file);
    if (ocrResult) {
      setResult(ocrResult);
    }
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isAvailable = status?.available ?? true;

  // Build context for AI from OCR result
  const buildContext = () => {
    if (!result) return "";
    
    let context = "Extracted text from scanned image:\n\n";
    
    if (result.structured) {
      if (result.structured.title) {
        context += `Title: ${result.structured.title}\n\n`;
      }
      context += `Content:\n${result.structured.content}\n\n`;
      
      if (result.structured.key_points.length > 0) {
        context += `Key Points:\n`;
        result.structured.key_points.forEach((point, i) => {
          context += `${i + 1}. ${point}\n`;
        });
        context += `\n`;
      }
      
      if (result.structured.tags.length > 0) {
        context += `Tags: ${result.structured.tags.join(', ')}\n`;
      }
    } else {
      context += result.raw_text;
    }
    
    return context;
  };

  const suggestedQuestions = result ? [
    "Summarize the main points from this note",
    "What are the key concepts in this text?",
    "Can you explain this in simpler terms?",
    "What questions should I ask about this content?",
    "How can I organize this information better?"
  ] : [
    "Summarize the main points",
    "What are the key takeaways?",
    "Explain this in simpler terms",
    "What questions should I ask about this?"
  ];

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Note Scanner</h1>
        <p className="text-muted-foreground">
          Capture handwritten or printed notes and convert them to text
        </p>
      </div>

      {/* Status Alert */}
      {status && !status.available && (
        <Card className="border-amber-500">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Tesseract OCR Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Note Scanner requires Tesseract OCR to be installed on your system to extract text from images.
                  </p>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-2">Quick Install Options:</p>
                      <div className="space-y-2 pl-4">
                        <div className="flex items-start gap-2">
                          <span className="text-primary font-mono">1.</span>
                          <div>
                            <span className="font-medium">Chocolatey:</span>
                            <code className="block mt-1 bg-muted px-2 py-1 rounded text-xs">
                              choco install tesseract
                            </code>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary font-mono">2.</span>
                          <div>
                            <span className="font-medium">Winget:</span>
                            <code className="block mt-1 bg-muted px-2 py-1 rounded text-xs">
                              winget install --id=UB-Mannheim.TesseractOCR -e
                            </code>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary font-mono">3.</span>
                          <div>
                            <span className="font-medium">Manual Download:</span>
                            <a 
                              href="https://github.com/UB-Mannheim/tesseract/wiki"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-1 text-primary hover:underline text-xs"
                            >
                              Download from GitHub →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="font-medium mb-1">After Installation:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
                        <li>Restart your terminal/IDE</li>
                        <li>Restart the backend API server</li>
                        <li>Refresh this page</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input and Result Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Capture or Upload</CardTitle>
            <CardDescription>
              Take a photo or upload an image of your notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="camera" disabled>
                  <Camera className="h-4 w-4 mr-2" />
                  Camera
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                {!preview ? (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium">Click or drag image to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG, JPEG, GIF, WebP, or BMP up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={!isAvailable || isProcessing}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full rounded-lg border"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleReset}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {isProcessing && (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing image...</span>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="camera" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Camera capture coming soon</p>
                  <p className="text-sm">Use the upload option for now</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Extracted Text</CardTitle>
                <CardDescription>
                  OCR results from your image
                </CardDescription>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  {result.confidence !== undefined && result.confidence !== null && (
                    <Badge variant="outline">
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {result.processing_time_ms}ms
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Raw Text */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Raw Text</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(result.raw_text)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {result.raw_text || 'No text detected'}
                    </pre>
                  </div>
                </div>

                {/* Structured Result */}
                {result.structured && (
                  <StructuredResult note={result.structured} onCopy={handleCopy} />
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Scan Another
                  </Button>
                  <Button
                    onClick={() =>
                      handleCopy(
                        result.structured?.content || result.raw_text
                      )
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No results yet</p>
                <p className="text-sm">Upload an image to extract text</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Ask AI Panel - Takes 1 column */}
    <div className="lg:col-span-1">
      <AskAIPanel
        title="Ask AI About Scan"
        description="Get insights from the extracted text"
        context={buildContext()}
        suggestedQuestions={suggestedQuestions}
        className="sticky top-6"
      />
    </div>
  </div>
        </div>
      </div>
    </AppShell>
  );
}

// Structured Result Component
function StructuredResult({ 
  note, 
  onCopy 
}: { 
  note: StructuredNote; 
  onCopy: (text: string) => void;
}) {
  return (
    <div className="space-y-3">
      {note.title && (
        <div>
          <h4 className="text-sm font-medium mb-1">Title</h4>
          <p className="text-sm">{note.title}</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium">Structured Content</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(note.content)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-3 bg-muted rounded-lg max-h-48 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">
            {note.content}
          </pre>
        </div>
      </div>

      {note.key_points.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-1">Key Points</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {note.key_points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {note.dates_mentioned.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-1">Dates Mentioned</h4>
          <div className="flex flex-wrap gap-2">
            {note.dates_mentioned.map((date, i) => (
              <Badge key={i} variant="secondary">{date}</Badge>
            ))}
          </div>
        </div>
      )}

      {note.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-1">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, i) => (
              <Badge key={i} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
