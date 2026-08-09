import Link from "next/link";
import { getSettings } from "@/lib/admin-store";

export default function SurveyPage() {
  const { siteCopy } = getSettings();
  return (
    <main className="font-ikea flex min-h-screen items-center justify-center bg-white text-ikea-black">
      <div className="max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-bold">{siteCopy.survey.title}</h1>
        <p className="mt-3 text-sm leading-6 text-ikea-muted">
          {siteCopy.survey.body}
        </p>
        <Link
          href="/"
          className="i-btn i-btn--primary mt-6 inline-flex h-10 items-center px-6 text-xs font-bold text-white"
        >
          {siteCopy.survey.buttonLabel}
        </Link>
      </div>
    </main>
  );
}
