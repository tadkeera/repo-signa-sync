import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getByType, getByTypeAndUser, deleteRecord, updateRecord, updateRecordStatus, type FormRecord } from "@/lib/db";
import { exportToPdf, exportToHtml, printElement, shareViaWhatsApp, shareViaEmail } from "@/lib/pdfUtils";
import { getSignature } from "@/lib/signature";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, FileDown, Pencil, Printer, FileCode, Share2, ArrowRight, PenTool, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormHeader from "@/components/FormHeader";

const typeLabels: Record<string, string> = {
  "doctor-support": "سجلات نماذج دعم الأطباء",
  "consignment": "سجلات نماذج التصريف",
  "extra-bonus": "سجلات نماذج البونص الإضافي",
};

function getRecordName(record: FormRecord): string {
  const d = record.data;
  if (record.type === "doctor-support") return (d.doctor || d.doctorName || "") as string;
  if (record.type === "consignment") return (d.clientName || "") as string;
  if (record.type === "extra-bonus") return (d.subject || d.clientName || "") as string;
  return "";
}

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  "pending-approval": "بانتظار الاعتماد",
  approved: "معتمد",
};

const Reports = () => {
  const { user } = useAuth();
  const { type } = useParams<{ type: string }>();
  const formType = (type || "doctor-support") as FormRecord["type"];
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [viewRecord, setViewRecord] = useState<FormRecord | null>(null);
  const [editRecord, setEditRecord] = useState<FormRecord | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [signatureRecord, setSignatureRecord] = useState<FormRecord | null>(null);
  const { toast } = useToast();

  const reload = () => {
    // Representatives only see their own records
    if (user?.role === 'representative') {
      setRecords(getByTypeAndUser(formType, user.id));
    } else {
      setRecords(getByType(formType));
    }
  };

  useEffect(() => { reload(); }, [formType, user]);

  const handleDelete = (id: string) => {
    deleteRecord(id);
    reload();
    toast({ title: "تم الحذف", description: "تم حذف السجل بنجاح" });
  };

  const handleExportPdf = async (record: FormRecord) => {
    setViewRecord(record);
    setTimeout(async () => {
      await exportToPdf("record-preview-print", `${typeLabels[record.type] || record.type}-${getRecordName(record)}.pdf`);
      setViewRecord(null);
    }, 800);
  };

  const handlePrint = (record: FormRecord) => {
    setViewRecord(record);
    setTimeout(() => {
      printElement("record-preview-print");
      setViewRecord(null);
    }, 800);
  };

  const startEdit = (record: FormRecord) => {
    setEditRecord(record);
    setEditData({ ...record.data });
  };

  const saveEdit = () => {
    if (!editRecord) return;
    updateRecord(editRecord.id, editData);
    reload();
    setEditRecord(null);
    toast({ title: "تم التعديل", description: "تم تحديث السجل بنجاح" });
  };

  const handleAddSignature = (record: FormRecord) => {
    const sig = getSignature(user?.id);
    if (!sig) {
      toast({ title: "لا يوجد توقيع", description: "يرجى رفع توقيع أولاً من صفحة إدارة التوقيع", variant: "destructive" });
      return;
    }
    setSignatureRecord(record);
  };

  const handleSubmitForApproval = (record: FormRecord) => {
    updateRecordStatus(record.id, 'pending-approval');
    reload();
    toast({ title: "تم الإرسال", description: "تم إرسال النموذج لاعتماد مدير الفرع" });
  };

  const editableFields: Record<string, { key: string; label: string }[]> = {
    "doctor-support": [
      { key: "date", label: "التاريخ" }, { key: "supervisor", label: "مشرف شركة" },
      { key: "amount", label: "المبلغ" }, { key: "rep", label: "مقدم الطلب" },
      { key: "doctor", label: "الدكتور" }, { key: "specialty", label: "أخصائي" },
      { key: "morning", label: "صباحاً" }, { key: "evening", label: "مساءً" },
      { key: "purpose", label: "مقابل" }, { key: "items", label: "الأصناف" },
    ],
    "extra-bonus": [
      { key: "date", label: "التاريخ" }, { key: "branch", label: "الفرع" },
      { key: "recipient", label: "المرسل إليه" }, { key: "subject", label: "الموضوع" },
      { key: "invoice", label: "رقم الفاتورة" }, { key: "rep", label: "المندوب" },
    ],
    "consignment": [
      { key: "date", label: "التاريخ" }, { key: "branch", label: "الفرع" },
      { key: "rep", label: "المندوب" },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Link to="/reports" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowRight className="h-5 w-5" />
          <span className="font-medium">رجوع</span>
        </Link>
        <h1 className="text-2xl font-bold text-primary">{typeLabels[formType] || "السجلات"}</h1>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground"><p className="text-lg">لا توجد سجلات محفوظة</p></div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div key={record.id} className="bg-card rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {typeLabels[record.type] || record.type}
                  </span>
                  <span className="font-bold text-sm">{getRecordName(record) || "بدون اسم"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(record.createdAt).toLocaleDateString("ar-YE", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  {record.status && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'approved' ? 'bg-green-100 text-green-800' :
                      record.status === 'pending-approval' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {statusLabels[record.status] || record.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <Button variant="ghost" size="icon" title="عرض" onClick={() => setViewRecord(record)}>
                  <Eye className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" title="إضافة صورة التوقيع" onClick={() => handleAddSignature(record)}>
                  <PenTool className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" title="تعديل" onClick={() => startEdit(record)}>
                  <Pencil className="h-4 w-4 text-primary" />
                </Button>
                {/* Submit for approval - only for reps and draft records */}
                {user?.role === 'representative' && (!record.status || record.status === 'draft') && (
                  <Button variant="ghost" size="sm" title="اعتماد" onClick={() => handleSubmitForApproval(record)} className="gap-1 text-primary">
                    <CheckCircle className="h-4 w-4" /> اعتماد
                  </Button>
                )}
                <Button variant="ghost" size="icon" title="تصدير PDF" onClick={() => handleExportPdf(record)}>
                  <FileDown className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" title="طباعة" onClick={() => handlePrint(record)}>
                  <Printer className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" title="حذف" onClick={() => handleDelete(record.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewRecord && !editRecord && !signatureRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewRecord ? typeLabels[viewRecord.type] : ""}</DialogTitle></DialogHeader>
          {viewRecord && (
            <div id="record-preview-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px" }}>
              <FormHeader />
              <RecordPrintContent record={viewRecord} showSignature={false} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Preview Dialog */}
      <Dialog open={!!signatureRecord} onOpenChange={() => setSignatureRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>معاينة مع التوقيع</DialogTitle></DialogHeader>
          {signatureRecord && (
            <>
              <div id="record-preview-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px" }}>
                <FormHeader />
                <RecordPrintContent record={signatureRecord} showSignature={true} />
              </div>
              <div className="flex gap-2 mt-3 justify-center flex-wrap">
                <Button onClick={async () => {
                  await exportToPdf("record-preview-print", `${typeLabels[signatureRecord.type]}-${getRecordName(signatureRecord)}-موقع.pdf`);
                }}>
                  <FileDown className="h-4 w-4 ml-1" />تصدير PDF
                </Button>
                <Button variant="outline" onClick={() => printElement("record-preview-print")}>
                  <Printer className="h-4 w-4 ml-1" />طباعة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تعديل السجل</DialogTitle></DialogHeader>
          {editRecord && (
            <div className="grid gap-3">
              {(editableFields[editRecord.type] || []).map(f => (
                <div key={f.key}>
                  <Label className="text-sm">{f.label}</Label>
                  <Input value={(editData[f.key] as string) || ""} onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <Button onClick={saveEdit} className="mt-3">حفظ التعديلات</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Signature inline component
function SignatureImage({ src, width = 80, height = 40 }: { src?: string | null; width?: number; height?: number }) {
  if (!src) return null;
  return (
    <img src={src} alt="التوقيع" style={{ width: `${width}px`, height: `${height}px`, objectFit: "contain", display: "inline-block", verticalAlign: "middle" }} />
  );
}

function RecordPrintContent({ record, showSignature = false }: { record: FormRecord; showSignature?: boolean }) {
  const d = record.data;
  const sig = showSignature ? (record.repSignature || getSignature()) : null;

  if (record.type === "doctor-support") {
    const pharmacies = (d.pharmacies as any[]) || [];
    return (
      <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
        <h1 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", margin: "5px 0 10px" }}>استمارة دعم طبيب</h1>
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>التاريخ: {d.date as string}</div>
        <div className="flex-row"><span>الأخ مشرف شركة:</span><span className="dotted-line out-text">{d.supervisor as string}</span><span>المحترم، بعد التحية،</span></div>
        <div className="flex-row"><span>نرجو الموافقة على صرف مبلغ وقدره (</span><span className="dotted-line out-text">{d.amount as string}</span><span>) فقط.</span></div>
        <div className="flex-row">
          <div style={{ flexBasis: "55%", display: "flex", alignItems: "baseline" }}><span>للأخ الدكتور:</span><span className="dotted-line out-text">{d.doctor as string}</span></div>
          <div style={{ flexBasis: "42%", display: "flex", alignItems: "baseline" }}><span>أخصائي:</span><span className="dotted-line out-text">{d.specialty as string}</span></div>
        </div>
        <div className="flex-row">
          <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}><span>يعمل صباحاً في:</span><span className="dotted-line out-text">{d.morning as string}</span></div>
          <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}><span>ومساءً في:</span><span className="dotted-line out-text">{d.evening as string}</span></div>
        </div>
        <div className="flex-row"><span>مقابل / </span><span className="dotted-line out-text">{d.purpose as string}</span></div>
        <div className="flex-row"><span>لكتابة الأصناف التالية: </span><span className="dotted-line out-text">{d.items as string}</span></div>
        {pharmacies.length > 0 && (
          <table className="compact-table">
            <thead><tr><th>اسم الصيدلية</th><th>رقم الهاتف</th><th>قيمة المشتريات</th></tr></thead>
            <tbody>{pharmacies.map((p: any, i: number) => <tr key={i}><td>{p.name}</td><td>{p.phone}</td><td>{p.amount}</td></tr>)}</tbody>
          </table>
        )}
        <p style={{ textAlign: "center", fontWeight: "bold", fontSize: "12px" }}>وعليه نلتزم بوفاء المذكور بكتابة الأصناف، وفي حالة عدم الوفاء فنحن نتحمل المسؤولية كاملة.</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "20px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مقدم الطلب: {d.rep as string}</span>
            <SignatureImage src={sig} width={90} height={45} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مدير الفرع:</span>
            {record.managerSignature ? <SignatureImage src={record.managerSignature} width={90} height={45} /> : <span>............</span>}
          </div>
        </div>
        <div style={{ fontSize: "12px", marginTop: "10px" }}>
          <div className="box">
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>الأخ / مدير القطاع</span><span className="dotted-line"></span><span>المحترم،</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>نرجو الموافقة على صرف مبلغ وقدره (</span><span className="dotted-line"></span><span>) فقط للمذكور أعلاه.</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>مقابل</span><span className="dotted-line"></span></div>
            <p style={{ margin: "5px 0" }}>ونتحمل كامل المسؤولية بالتواصل مع الطبيب المذكور للتأكد من استلام الخدمة.</p>
          </div>
          <div className="box">
            <h4 style={{ fontWeight: "bold", margin: "0 0 5px 0", textDecoration: "underline" }}>الموافقة النهائية</h4>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>يعتمد ويقيد على حساب شركة /</span><span className="dotted-line"></span></div>
            <div style={{ fontWeight: "bold" }}>مدير القطاع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "150px" }}></span></div>
          </div>
          <div className="box box-receipt">
            <p style={{ margin: "0 0 6px 0", fontWeight: "bold", textAlign: "center" }}>استلمت المبلغ لدعم الطبيب المذكور أعلاه ونلتزم بكتابة الأصناف ونتحمل المسؤولية كاملة.</p>
          </div>
        </div>
      </div>
    );
  }

  if (record.type === "extra-bonus") {
    const items = (d.items as any[]) || [];
    return (
      <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "10px" }}>
          <div>التاريخ: {d.date as string}</div><div>الفرع: {d.branch as string}</div>
        </div>
        <div style={{ fontWeight: "bold" }}>الموضوع: بونص اضافي او دعم {d.subject as string}</div>
        <p>بالإشارة الى الموضوع أعلاه نرجو تكرمكم بالموافقة على صرف البونص الإضافي للمذكور</p>
        {items.length > 0 && (
          <table className="compact-table">
            <thead><tr><th>الرقم</th><th>اسم الصنف</th><th>الكمية</th><th>نسبة البونص</th><th>كمية التعويض</th></tr></thead>
            <tbody>{items.map((it: any, i: number) => <tr key={i}><td>{i+1}</td><td>{it.name}</td><td>{it.qty}</td><td>{it.bonusPercent}</td><td>{it.compensation}</td></tr>)}</tbody>
          </table>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>المندوب: {d.rep as string}</span>
            <SignatureImage src={sig} width={90} height={45} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مدير الفرع:</span>
            {record.managerSignature ? <SignatureImage src={record.managerSignature} width={90} height={45} /> : <span>............</span>}
          </div>
        </div>
      </div>
    );
  }

  if (record.type === "consignment") {
    const clients = (d.clients as any[]) || [];
    return (
      <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
        <div style={{ textAlign: "center", fontWeight: "bold" }}>بسم الله الرحمن الرحيم</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", margin: "10px 0" }}>
          <div>التاريخ: {d.date as string}</div><div>الفرع: {d.branch as string}</div>
        </div>
        <div style={{ fontWeight: "bold", textAlign: "center", textDecoration: "underline", margin: "10px 0" }}>الموضوع: إنزال بضاعة تحت التصريف</div>
        {clients.map((c: any, idx: number) => (
          <div key={idx} style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>العميل: {c.clientName}</div>
            <table className="compact-table">
              <thead><tr><th>اسم الصنف</th><th>الكمية</th><th>التاريخ</th></tr></thead>
              <tbody>{(c.items || []).map((it: any, i: number) => <tr key={i}><td>{it.name}</td><td>{it.qty}</td><td>{it.date}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>المندوب: {d.rep as string}</span>
            <SignatureImage src={sig} width={90} height={45} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مدير الفرع:</span>
            {record.managerSignature ? <SignatureImage src={record.managerSignature} width={90} height={45} /> : <span>............</span>}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default Reports;
