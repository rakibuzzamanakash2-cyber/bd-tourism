import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site";

/** Floating "Chat on WhatsApp" button for public pages. */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink("Hi DeltaWay, I'd like to ask about a trip.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-forest-900 px-4 py-3 text-sm font-medium text-paper shadow-lg transition-colors hover:bg-forest-800 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="size-5" aria-hidden="true" />
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
