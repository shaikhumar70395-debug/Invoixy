import { checkSecuritySetup } from "@/app/actions/auth";
import { SecuritySettingsForm } from "@/components/SecuritySettingsForm";
import { AutoLockSettingsForm } from "@/components/AutoLockSettingsForm";
import { AccountRecoveryForm } from "@/components/AccountRecoveryForm";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const securityInfo = await checkSecuritySetup();

  return (
    <div className="pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          Security & Access
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Manage your authentication preferences and secure your account.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_minmax(400px,0.7fr)] xl:gap-12">
        <div>
          <SecuritySettingsForm currentAuthType={securityInfo.authType} />
        </div>
        <div className="space-y-6">
          <AutoLockSettingsForm initialMinutes={securityInfo.autoLockMinutes ?? 15} />
          <AccountRecoveryForm hasRecoveryCode={securityInfo.hasRecoveryCode ?? false} />
          <div className="rounded-2xl border border-zinc-200/80 bg-white/50 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-violet-600">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            <h3 className="font-semibold text-zinc-900">Security Tips</h3>
          </div>
          <ul className="space-y-4 text-sm text-zinc-600">
            <li className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span><strong>Keep your PIN safe:</strong> Never share your 6-digit access code with employees or third parties.</span>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span><strong>Biometric Login:</strong> Fingerprint and Face ID support is coming in v1.1.0 to make access even faster.</span>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <span><strong>Auto-Lock:</strong> For your security, the dashboard requires re-authentication after an extended period of inactivity.</span>
            </li>
          </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
