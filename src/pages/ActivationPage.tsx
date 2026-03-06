import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.png";

const ACTIVATION_CODE = "WALEED770976667YAMAN";
const ACTIVATED_KEY = "bilquis-activated";

export function isActivated(): boolean {
  return localStorage.getItem(ACTIVATED_KEY) === "true";
}

const ActivationPage = ({ onActivated }: { onActivated: () => void }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleActivate = () => {
    if (code.trim() === ACTIVATION_CODE) {
      localStorage.setItem(ACTIVATED_KEY, "true");
      onActivated();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <div className="bg-card rounded-xl shadow-xl border p-8 max-w-md w-full text-center">
        <img src={logo} alt="شعار بلقيس" className="h-24 w-24 mx-auto mb-6 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground mb-2">تفعيل التطبيق</h1>
        <p className="text-sm text-muted-foreground mb-6">أدخل كود التفعيل للمتابعة</p>
        <Input
          value={code}
          onChange={e => { setCode(e.target.value); setError(false); }}
          placeholder="كود التفعيل"
          className="text-center text-lg mb-3"
          dir="ltr"
          onKeyDown={e => e.key === "Enter" && handleActivate()}
        />
        {error && <p className="text-destructive text-sm mb-3">كود التفعيل غير صحيح</p>}
        <Button onClick={handleActivate} className="w-full">تفعيل</Button>
      </div>
    </div>
  );
};

export default ActivationPage;
