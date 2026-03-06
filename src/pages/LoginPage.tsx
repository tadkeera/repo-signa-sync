import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = () => {
    const user = login(username, password);
    if (!user) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <div className="bg-card rounded-xl shadow-xl border p-8 max-w-md w-full text-center">
        <img src={logo} alt="شعار بلقيس" className="h-24 w-24 mx-auto mb-6 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground mb-2">تسجيل الدخول</h1>
        <p className="text-sm text-muted-foreground mb-6">أدخل بيانات الدخول للمتابعة</p>
        <div className="space-y-4 text-right">
          <div>
            <Label>اسم المستخدم</Label>
            <Input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(false); }}
              placeholder="اسم المستخدم"
              className="mt-1"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <Label>كلمة المرور</Label>
            <Input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="كلمة المرور"
              className="mt-1"
              dir="ltr"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>
        {error && <p className="text-destructive text-sm mt-3">اسم المستخدم أو كلمة المرور غير صحيحة</p>}
        <Button onClick={handleLogin} className="w-full mt-6">دخول</Button>
      </div>
    </div>
  );
};

export default LoginPage;
