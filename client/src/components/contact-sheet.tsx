import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import telegramIcon from "@assets/telegram-6896827_1280_1775837360062.png";
import { useLang } from "@/lib/i18n";

interface ContactSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactSheet({ open, onClose }: ContactSheetProps) {
  const { t } = useLang();
  const tr = t.contact;

  const { data: settings } = useQuery<{
    supportLink: string;
    support2Link: string;
    channelLink: string;
    groupLink: string;
  }>({
    queryKey: ["/api/settings/links"],
    enabled: open,
  });

  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  const items = [
    {
      label: tr.channel,
      sublabel: tr.channelSub,
      url: settings?.channelLink || "https://t.me/EiffageSupport",
      testId: "button-contact-channel",
    },
    {
      label: tr.group,
      sublabel: tr.groupSub,
      url: settings?.groupLink || "https://t.me/EiffageSupport",
      testId: "button-contact-group",
    },
    {
      label: tr.support,
      sublabel: tr.supportSub,
      url: settings?.supportLink || "https://t.me/EiffageSupport",
      testId: "button-contact-support",
    },
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl overflow-hidden"
        style={{ animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <p className="font-bold text-gray-800 text-base">{tr.title}</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#f5f5f5" }}
            data-testid="button-contact-close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="px-4 pb-8 space-y-3">
          {items.map((item) => (
            <button
              key={item.testId}
              onClick={() => openLink(item.url)}
              className="w-full flex items-center gap-4 bg-gray-50 rounded-2xl px-4 py-4 text-left"
              style={{ border: "1px solid #f0f0f0" }}
              data-testid={item.testId}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                <img src={telegramIcon} alt="Telegram" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
