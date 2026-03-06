import { useState, useEffect } from "react";
import { getUsers, type User, getManagerSignature, saveManagerSignature, deleteManagerSignature } from "@/lib/auth";
import { getPendingByUser, getAll, updateRecordSignature, updateRecordStatus, type FormRecord } from "@/lib/db";
import { getSignature } from "@/lib/signature";
import { exportToPdf, printElement } from "@/lib/pdfUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormHeader from "@/components/FormHeader";
import { Eye, PenTool, Printer, Bell, FileDown, Upload, Trash2, Check, Image } from "lucide-react";
import { useRef } from "react";

const typeLabels: Record<string, string> = {
  "doctor-support": "استمارة دعم طبيب",
  "consignment": "نموذج تصريف",
  "extra-bonus": "نموذج بونص إضافي",
};

function getRecordName(record: FormRecord): string {
  const d = record.data;
  if (record.type === "doctor-support") return (d.doctor || d.doctorName || "") as string;
  if (record.type === "consignment") return (d.clientName || "") as string;
  if (record.type === "extra-bonus") return (d.subject || d.clientName || "") as string;
  return "";
}

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [selectedRep, setSelectedRep] = useState<User | null>(null);
  const [repForms, setRepForms] = useState<FormRecord[]>([]);
  const [viewRecord, setViewRecord] = useState<FormRecord | null>(null);
  const [signingRecord, setSigningRecord] = useState<FormRecord | null>(null);
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);
  const [managerSig, setManagerSig] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const users = getUsers();
    const reps = users.filter(u => u.role === "representative");
    setRepresentatives(reps);

    const allRecords = getAll();
    const counts: Record<string, number> = {};
    reps.forEach(rep => {
      counts[rep.id] = allRecords.filter(r => r.userId === rep.id && r.status === 'pending-approval').length;
    });
    setPendingCounts(counts);

    if (user) {
      setManagerSig(getManagerSignature(user.id));
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const openRepForms = (rep: User) => {
    setSelectedRep(rep);
    const allRecords = getAll();
    setRepForms(allRecords.filter(r => r.userId === rep.id && r.status === 'pending-approval'));
  };

  const handleAddManagerSignature = (record: FormRecord) => {
    if (!user) return;
    const sig = getManagerSignature(user.id);
    if (!sig) {
      toast({ title: "لا يوجد توقيع", description: "يرجى إعداد توقيع مدير الفرع أولاً من الإعدادات", variant: "destructive" });
      return;
    }
    setSigningRecord(record);
  };

  const confirmManagerSignature = () => {
    if (!signingRecord || !user) return;
    const sig = getManagerSignature(user.id);
    if (!sig) return;
    updateRecordSignature(signingRecord.id, 'managerSignature', sig);
    updateRecordStatus(signingRecord.id, 'approved');
    toast({ title: "تم الاعتماد", description: "تم إضافة توقيع مدير الفرع واعتماد النموذج" });
    setSigningRecord(null);
    if (selectedRep) openRepForms(selectedRep);
    loadData();
  };

  const handleSigFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف صورة فقط", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        setSigPreview(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveManagerSig = () => {
    if (!sigPreview || !user) return;
    saveManagerSignature(user.id, sigPreview);
    setManagerSig(sigPreview);
    setSigPreview(null);
    toast({ title: "تم الحفظ", description: "تم حفظ توقيع مدير الفرع" });
  };

  const deleteManagerSig = () => {
    if (!user) return;
    deleteManagerSignature(user.id);
    setManagerSig(null);
    toast({ title: "تم الحذف", description: "تم حذف توقيع مدير الفرع" });
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">لوحة تحكم مدير الفرع</h1>
        <Button variant="outline" onClick={() => setShowSignatureSettings(true)} className="gap-2">
          <PenTool className="h-4 w-4" /> إعدادات التوقيع
        </Button>
      </div>

      {/* Representatives Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {representatives.map(rep => (
          <div
            key={rep.id}
            onClick={() => openRepForms(rep)}
            className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all p-6 cursor-pointer hover:-translate-y-1 relative"
          >
            {(pendingCounts[rep.id] || 0) > 0 && (
              <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">
                {pendingCounts[rep.id]}
              </div>
            )}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="bg-primary/10 rounded-full p-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-card-foreground">{rep.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                {pendingCounts[rep.id] || 0} نموذج بانتظار الاعتماد
              </p>
            </div>
          </div>
        ))}
        {representatives.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            لا يوجد مندوبين مسجلين. يرجى إضافة مندوبين من صفحة إدارة المستخدمين.
          </div>
        )}
      </div>

      {/* Rep Forms Dialog */}
      <Dialog open={!!selectedRep} onOpenChange={() => setSelectedRep(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>نماذج {selectedRep?.displayName} - بانتظار الاعتماد</DialogTitle></DialogHeader>
          {repForms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد نماذج بانتظار الاعتماد</p>
          ) : (
            <div className="grid gap-3">
              {repForms.map(record => (
                <div key={record.id} className="bg-muted/50 rounded-lg p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                      {typeLabels[record.type] || record.type}
                    </span>
                    <span className="font-bold text-sm mr-2">{getRecordName(record) || "بدون اسم"}</span>
                    <span className="text-xs text-muted-foreground mr-2">
                      {new Date(record.createdAt).toLocaleDateString("ar-YE")}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setViewRecord(record)} className="gap-1">
                      <Eye className="h-4 w-4" /> عرض
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAddManagerSignature(record)} className="gap-1">
                      <PenTool className="h-4 w-4" /> توقيع المدير
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setViewRecord(record);
                      setTimeout(() => printElement("manager-record-print"), 800);
                    }} className="gap-1">
                      <Printer className="h-4 w-4" /> طباعة
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog open={!!viewRecord && !signingRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewRecord ? typeLabels[viewRecord.type] : ""}</DialogTitle></DialogHeader>
          {viewRecord && (
            <div id="manager-record-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px" }}>
              <FormHeader />
              <RecordContent record={viewRecord} showRepSig={true} showManagerSig={!!viewRecord.managerSignature} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signing Dialog */}
      <Dialog open={!!signingRecord} onOpenChange={() => setSigningRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>إضافة توقيع مدير الفرع</DialogTitle></DialogHeader>
          {signingRecord && user && (
            <>
              <div id="manager-sign-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px" }}>
                <FormHeader />
                <RecordContent record={signingRecord} showRepSig={true} showManagerSig={true} managerSigUrl={getManagerSignature(user.id) || undefined} />
              </div>
              <div className="flex gap-2 mt-3 justify-center flex-wrap">
                <Button onClick={confirmManagerSignature} className="gap-2">
                  <Check className="h-4 w-4" /> حفظ النموذج بالتوقيع
                </Button>
                <Button variant="outline" onClick={async () => {
                  await exportToPdf("manager-sign-print", `${typeLabels[signingRecord.type]}-${getRecordName(signingRecord)}-معتمد.pdf`);
                }}>
                  <FileDown className="h-4 w-4 ml-1" /> تصدير PDF
                </Button>
                <Button variant="outline" onClick={() => printElement("manager-sign-print")}>
                  <Printer className="h-4 w-4 ml-1" /> طباعة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manager Signature Settings */}
      <Dialog open={showSignatureSettings} onOpenChange={setShowSignatureSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إعدادات توقيع مدير الفرع</DialogTitle></DialogHeader>
          {managerSig && (
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">التوقيع الحالي</p>
              <div className="inline-block border-2 border-dashed border-primary/30 rounded-lg p-4 bg-background">
                <img src={managerSig} alt="توقيع المدير" className="max-h-20 max-w-full object-contain" />
              </div>
              <div className="mt-2">
                <Button variant="destructive" size="sm" onClick={deleteManagerSig}>
                  <Trash2 className="h-4 w-4 ml-1" /> حذف التوقيع
                </Button>
              </div>
            </div>
          )}
          <div
            className="bg-muted border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleSigFile} />
            <Image className="h-10 w-10 mx-auto text-primary/50 mb-2" />
            <p className="text-sm text-muted-foreground">انقر لاختيار صورة التوقيع</p>
          </div>
          {sigPreview && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground mb-2">معاينة</p>
              <div className="inline-block border rounded-lg p-4 bg-background">
                <img src={sigPreview} alt="معاينة" className="max-h-20 max-w-full object-contain" />
              </div>
              <div className="mt-2">
                <Button onClick={saveManagerSig}><Check className="h-4 w-4 ml-1" /> حفظ التوقيع</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Shared record content renderer
function RecordContent({ record, showRepSig, showManagerSig, managerSigUrl }: { 
  record: FormRecord; showRepSig: boolean; showManagerSig: boolean; managerSigUrl?: string 
}) {
  const d = record.data;
  const repSig = record.repSignature;
  const mgrSig = managerSigUrl || record.managerSignature;

  const SignatureImg = ({ src, width = 90, height = 45 }: { src?: string | null; width?: number; height?: number }) => {
    if (!src) return null;
    return <img src={src} alt="التوقيع" style={{ width: `${width}px`, height: `${height}px`, objectFit: "contain", display: "inline-block", verticalAlign: "middle" }} />;
  };

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
            {showRepSig && <SignatureImg src={repSig} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مدير الفرع:</span>
            {showManagerSig && mgrSig ? <SignatureImg src={mgrSig} /> : <span>............</span>}
          </div>
        </div>
        <div style={{ fontSize: "12px", marginTop: "10px" }}>
          <div className="box">
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>الأخ / مدير القطاع</span><span className="dotted-line"></span><span>المحترم،</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>نرجو الموافقة على صرف مبلغ وقدره (</span><span className="dotted-line"></span><span>) فقط للمذكور أعلاه.</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>مقابل</span><span className="dotted-line"></span></div>
            <p style={{ margin: "5px 0" }}>ونتحمل كامل المسؤولية بالتواصل مع الطبيب المذكور للتأكد من استلام الخدمة.</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "10px" }}>
              <div>المكتب العلمي (الاسم): <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
              <div>التوقيع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
            </div>
          </div>
          <div className="box">
            <h4 style={{ fontWeight: "bold", margin: "0 0 5px 0", textDecoration: "underline" }}>الموافقة النهائية</h4>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>يعتمد ويقيد على حساب شركة /</span><span className="dotted-line"></span></div>
            <div style={{ fontWeight: "bold", margin: "6px 0" }}>علماً بأن آخر دعم للمذكور كان بتاريخ &nbsp;&nbsp; / &nbsp;&nbsp; / 202&nbsp; م.</div>
            <div style={{ fontWeight: "bold" }}>مدير القطاع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "150px" }}></span></div>
          </div>
          <div className="box">
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>الأخ أمين الصندوق لفرع</span><span className="dotted-line"></span><span>المحترم،</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>لا مانع من صرف (</span><span className="dotted-line"></span><span>) للأخ د.</span><span className="dotted-line"></span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>ويقيد على حساب شركة (</span><span className="dotted-line"></span><span>)</span></div>
            <div style={{ display: "flex", justifyContent: "space-around", fontWeight: "bold", marginTop: "10px" }}>
              <div>المدير العام: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
              <div>مدير المبيعات: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
            </div>
          </div>
          <div className="box box-receipt">
            <p style={{ margin: "0 0 6px 0", fontWeight: "bold", textAlign: "center" }}>استلمت المبلغ لدعم الطبيب المذكور أعلاه ونلتزم بكتابة الأصناف ونتحمل المسؤولية كاملة.</p>
            <div style={{ display: "flex", justifyContent: "space-around", fontWeight: "bold" }}>
              <div>الاسم: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "120px" }}></span></div>
              <div>التوقيع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "120px" }}></span></div>
            </div>
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
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>الأخ/ {d.recipient as string}</div>
        <div style={{ textAlign: "left", fontWeight: "bold", marginBottom: "5px" }}>المحترم</div>
        <p style={{ textAlign: "center" }}>بعد التحية ،،،،،</p>
        <div style={{ fontWeight: "bold" }}>الموضوع: بونص اضافي او دعم {d.subject as string}</div>
        <p>بالإشارة الى الموضوع أعلاه نرجو تكرمكم بالموافقة على صرف البونص الإضافي للمذكور وذلك على النحو التالي :-</p>
        {items.length > 0 && (
          <table className="compact-table">
            <thead><tr><th>الرقم</th><th>اسم الصنف</th><th>الكمية</th><th>نسبة البونص</th><th>كمية التعويض</th></tr></thead>
            <tbody>{items.map((it: any, i: number) => <tr key={i}><td>{i+1}</td><td>{it.name}</td><td>{it.qty}</td><td>{it.bonusPercent}</td><td>{it.compensation}</td></tr>)}</tbody>
          </table>
        )}
        <div style={{ fontWeight: "bold" }}>فاتورة رقم: {d.invoice as string} ({d.paymentType as string})</div>
        <p>وعليه .... التزم بتصريف البضاعة المباعة وعدم إرجاعها ونتحمل المسئولية كامله .</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>المندوب: {d.rep as string}</span>
            {showRepSig && <SignatureImg src={repSig} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مدير الفرع:</span>
            {showManagerSig && mgrSig ? <SignatureImg src={mgrSig} /> : <span>............</span>}
          </div>
          <div>المكتب العلمي: ............</div>
          <div>مدير القطاع: ............</div>
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
        <div style={{ fontWeight: "bold", textAlign: "center", textDecoration: "underline", margin: "10px 0" }}>
          الموضوع: إنزال بضاعة تحت التصريف
        </div>
        <p>اشارة الى الموضوع اعلاه ، نرجو منكم الموافقة على أنزال الاصناف التالية تحت التصريف وعلى مسئوليتي متابعتها أولاً بأول وعدم وجود أي منتهيات والاصناف هي :</p>
        {clients.map((c: any, idx: number) => (
          <div key={idx} style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>العميل: {c.clientName}</div>
            <table className="compact-table">
              <thead><tr><th>اسم الصنف</th><th>الكمية</th><th>التاريخ</th></tr></thead>
              <tbody>{(c.items || []).map((it: any, i: number) => <tr key={i}><td>{it.name}</td><td>{it.qty}</td><td>{it.date}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>المندوب: {d.rep as string}</span>
            {showRepSig && <SignatureImg src={repSig} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>مدير الفرع:</span>
            {showManagerSig && mgrSig ? <SignatureImg src={mgrSig} /> : <span>............</span>}
          </div>
          <div>المكتب العلمي: ............</div>
          <div>مدير القطاع: ............</div>
        </div>
      </div>
    );
  }

  return null;
}

export default ManagerDashboard;
