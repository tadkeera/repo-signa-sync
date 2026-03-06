import { Button } from "@/components/ui/button";
import { FileDown, Printer, FileCode, Share2 } from "lucide-react";
import { exportToPdf, exportToHtml, printElement, shareViaWhatsApp, shareViaEmail } from "@/lib/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ExportPdfButtonProps {
  elementId: string;
  fileName?: string;
  documentTitle?: string;
}

const ExportPdfButton = ({ elementId, fileName = "document.pdf", documentTitle = "مستند" }: ExportPdfButtonProps) => {
  const { toast } = useToast();
  const [showShare, setShowShare] = useState(false);

  const handleExportPdf = async () => {
    try {
      await exportToPdf(elementId, fileName);
      toast({ title: "تم التصدير بنجاح", description: "تم حفظ الملف بصيغة PDF" });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التصدير", variant: "destructive" });
    }
  };

  const handleExportHtml = () => {
    try {
      exportToHtml(elementId, fileName.replace('.pdf', '.html'));
      toast({ title: "تم التصدير", description: "تم حفظ الملف بصيغة HTML" });
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التصدير", variant: "destructive" });
    }
  };

  const handlePrint = () => printElement(elementId);

  return (
    <div className="flex flex-wrap gap-2 no-print relative">
      <Button onClick={handleExportPdf} className="gap-2" size="sm">
        <FileDown className="h-4 w-4" />تصدير PDF
      </Button>
      <Button onClick={handleExportHtml} variant="outline" className="gap-2" size="sm">
        <FileCode className="h-4 w-4" />تصدير HTML
      </Button>
      <Button onClick={handlePrint} variant="outline" className="gap-2" size="sm">
        <Printer className="h-4 w-4" />طباعة مباشرة
      </Button>
      <div className="relative">
        <Button onClick={() => setShowShare(!showShare)} variant="outline" className="gap-2" size="sm">
          <Share2 className="h-4 w-4" />مشاركة
        </Button>
        {showShare && (
          <div className="absolute top-full mt-1 right-0 bg-card border rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
            <button
              onClick={() => { shareViaWhatsApp(`${documentTitle} - تم إنشاؤه من تطبيق نماذج بلقيس`); setShowShare(false); }}
              className="w-full text-right px-3 py-2 hover:bg-muted rounded text-sm font-bold"
            >واتساب</button>
            <button
              onClick={() => { shareViaEmail(documentTitle, `${documentTitle} - تم إنشاؤه من تطبيق نماذج مخازن بلقيس للأدوية`); setShowShare(false); }}
              className="w-full text-right px-3 py-2 hover:bg-muted rounded text-sm font-bold"
            >بريد إلكتروني</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPdfButton;
