"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Surface, PrimaryButton } from "@neighbordoc/ui";

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consultationId: id,
          rating,
          comment: comment.trim() || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.error ?? "फीडबैक दर्ज करने में समस्या हुई। कृपया दोबारा प्रयास करें।");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("सर्वर से संपर्क नहीं हो पाया। कृपया नेटवर्क जांचें।");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#FAFBF9] py-12 px-4 sm:px-6">
        <main className="mx-auto max-w-md text-center">
          <Surface className="border-[#D1E6E3] shadow-sm">
            <div className="text-4xl">🙏</div>
            <h1 className="mt-3 text-xl font-black text-[#0F2F2E]">आपकी राय के लिए धन्यवाद!</h1>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              NeighborDoc और Qsura India Pvt. Ltd. आपकी प्रतिक्रिया की कद्र करते हैं। इससे हमें ग्रामीण और कस्बाई परिवारों को और बेहतर स्वास्थ्य सेवाएं देने में मदद मिलती है।
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                href={`/consultations/${id}/prescription`}
                className="w-full rounded-xl bg-[#0B4F48] py-2.5 text-xs font-bold text-white hover:bg-[#083E38] transition"
              >
                📄 अपना पर्चा (Prescription) देखें
              </Link>
              <Link
                href="/"
                className="w-full rounded-xl border border-[#CBD5E1] bg-white py-2.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] transition"
              >
                होमपेज पर वापस जाएं
              </Link>
            </div>
          </Surface>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] py-8 px-4 sm:px-6">
      <main className="mx-auto max-w-md">
        <div className="mb-4">
          <Link href={`/consultations/${id}`} className="text-xs font-bold text-[#0B4F48] hover:underline">
            &larr; परामर्श स्थिति पर वापस जाएं
          </Link>
        </div>

        <Surface className="border-[#D1E6E3] shadow-sm">
          <div className="border-b border-[#E9ECEF] pb-4">
            <span className="rounded-md bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-bold text-[#0B4F48]">
              टोकन: {id}
            </span>
            <h1 className="mt-2 text-xl font-black text-[#0F2F2E]">परामर्श अनुभव व रेटिंग</h1>
            <p className="mt-1 text-xs text-[#64748B]">
              डॉक्टर के साथ आपकी बातचीत कैसी रही? अपनी बहुमूल्य राय साझा करें।
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#334155]">डॉक्टर सेवा रेटिंग (1 से 5 स्टार):</label>
              <div className="mt-2 flex items-center justify-center gap-3 rounded-2xl bg-[#F8FAF9] p-3 border border-[#E9ECEF]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    {star <= rating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-center text-xs font-bold text-[#0B4F48]">
                {rating === 5 && "उत्कृष्ट (Excellent)"}
                {rating === 4 && "बहुत अच्छा (Very Good)"}
                {rating === 3 && "संतोषजनक (Satisfactory)"}
                {rating === 2 && "सुधार की आवश्यकता (Needs Improvement)"}
                {rating === 1 && "असंतोषजनक (Poor)"}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155]">
                कोई सुझाव या टिप्पणी (वैकल्पिक):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="क्या डॉक्टर ने समय पर कॉल किया? क्या आपको परामर्श से संतुष्टि मिली?"
                className="mt-1 min-h-[90px] w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-xs font-medium text-[#0F172A] focus:border-[#0B4F48] focus:bg-white focus:outline-none"
              />
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-red-600">{errorMessage}</p>
            )}

            <PrimaryButton
              disabled={status === "submitting"}
              className="w-full text-xs py-3"
            >
              {status === "submitting" ? "सबमिट हो रहा है..." : "✓ रेटिंग और फीडबैक भेजें"}
            </PrimaryButton>
          </form>
        </Surface>
      </main>
    </div>
  );
}
