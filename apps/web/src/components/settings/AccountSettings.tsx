import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@labas/ui/components/card";
import { Input } from "@labas/ui/components/input";
import { Label } from "@labas/ui/components/label";
import { Button } from "@labas/ui/components/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";
import { authClient } from "@/lib/auth-client";
import { env } from "@labas/env/web";
import { CommunityCard } from "@/components/settings/CommunityCard";

type AccountInfo = {
  id: string;
  providerId: string;
  accountId: string;
  userId: string;
};

export function AccountSettings() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    authClient.listAccounts().then((res) => {
      if (res.data) {
        setAccounts(res.data as AccountInfo[]);
      }
      setLoadingAccounts(false);
    });
  }, []);

  const hasEmailAccount = accounts.some((a) => a.providerId === "email");
  const hasGoogleAccount = accounts.some((a) => a.providerId === "google");
  const canDisconnectGoogle = hasEmailAccount;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      toast.error("Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Gagal mengubah password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsChangingEmail(true);
    try {
      await authClient.changeEmail({ newEmail });
      toast.success("Email berhasil diubah. Cek email baru Anda untuk verifikasi.");
      setNewEmail("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Gagal mengubah email");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleConnectGoogle = async () => {
    setLinking(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `${env.VITE_SITE_URL}/settings?tab=account`,
      });
    } catch {
      toast.error("Gagal menghubungkan Google");
    } finally {
      setLinking(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setUnlinking(true);
    try {
      await authClient.unlinkAccount({
        providerId: "google",
      });
      toast.success("Akun Google berhasil diputuskan");
      setAccounts((prev) => prev.filter((a) => a.providerId !== "google"));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Gagal memutuskan akun Google");
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardHeader>
          <CardTitle className="font-headline text-[var(--clay-black)]">Informasi Akun</CardTitle>
          <CardDescription className="text-[var(--warm-charcoal)]">
            Detail akun Anda saat ini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm text-[var(--warm-charcoal)]">Nama</Label>
            <p className="font-medium text-[var(--clay-black)]">{user?.name}</p>
          </div>
          <div>
            <Label className="text-sm text-[var(--warm-charcoal)]">Email</Label>
            <p className="font-medium text-[var(--clay-black)]">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
        <CardHeader>
          <CardTitle className="font-headline text-[var(--clay-black)]">Akun Terhubung</CardTitle>
          <CardDescription className="text-[var(--warm-charcoal)]">
            Kelola metode masuk ke akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccounts ? (
            <p className="text-sm text-[var(--warm-charcoal)]">Memuat...</p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">Google</p>
                    <p className="text-xs text-[var(--warm-charcoal)]">
                      {hasGoogleAccount ? "Terhubung" : "Belum terhubung"}
                    </p>
                  </div>
                </div>
                {hasGoogleAccount ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectGoogle}
                    disabled={unlinking || !canDisconnectGoogle}
                    title={!canDisconnectGoogle ? "Tidak bisa putuskan — hanya Google satu-satunya metode masuk" : "Putuskan Google"}
                  >
                    {unlinking ? "Memutuskan..." : "Putuskan"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGoogle}
                    disabled={linking}
                  >
                    {linking ? "Menghubungkan..." : "Hubungkan"}
                  </Button>
                )}
              </div>
              {hasGoogleAccount && !canDisconnectGoogle && (
                <p className="text-xs text-[var(--warm-charcoal)]">
                  Minimal harus ada satu metode masuk. Tambahkan email/password sebelum memutuskan Google.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {hasEmailAccount && (
        <>
          <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
            <CardHeader>
              <CardTitle className="font-headline text-[var(--clay-black)]">Ubah Password</CardTitle>
              <CardDescription className="text-[var(--warm-charcoal)]">
                Gunakan password yang kuat dan unik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                  />
                </div>
                <Button
                  type="submit"
                  className="rounded-[var(--radius-lg)]"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isChangingPassword ? "Menyimpan..." : "Ubah Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="clay-shadow bg-[var(--pure-white)] border-2 border-[var(--oat-border)] rounded-[var(--radius-xl)]">
            <CardHeader>
              <CardTitle className="font-headline text-[var(--clay-black)]">Ubah Email</CardTitle>
              <CardDescription className="text-[var(--warm-charcoal)]">
                Masukkan alamat email baru Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">Email Baru</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama@email.com"
                  />
                </div>
                <Button type="submit" className="rounded-[var(--radius-lg)]" disabled={isChangingEmail || !newEmail}>
                  {isChangingEmail ? "Menyimpan..." : "Ubah Email"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <CommunityCard />
    </div>
  );
}