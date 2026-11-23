import { useState } from "react";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  ShoppingCart,
  X,
} from "lucide-react";
import logoImg from "@/imports/Logo.png";
import type { View } from "@/types";

const questions = [
  {
    question: "¿Los productos son originales y tienen garantía?",
    answer:
      "Todos nuestros productos se revisan antes de publicarse. Las condiciones de garantía dependen de cada producto y se informan al momento de la compra.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Puedes pagar mediante transferencia, pago móvil, Zelle, Binance o efectivo en tienda.",
  },
  {
    question: "¿Cuánto tarda el envío?",
    answer:
      "El tiempo de entrega depende de la dirección y la disponibilidad del producto.",
  },
  {
    question: "¿Cómo puedo consultar el estado de mi orden?",
    answer:
      "Inicia sesión y entra en “Mis órdenes” para consultar el estado de cada compra.",
  },
];

export function CatalogFooter({ setView }: { setView: (v: View) => void }) {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);
  const [legalDocument, setLegalDocument] = useState<
    "privacy" | "terms" | "security" | "rights" | null
  >(null);

  const legalContent = {
    privacy: {
      title: "Política de privacidad",
      text: "Music&Sport protege los datos proporcionados durante el registro y la compra. La información se utiliza para gestionar cuentas, órdenes, pagos y atención al cliente.",
    },
    terms: {
      title: "Términos y condiciones",
      text: "Al utilizar Music&Sport aceptas las condiciones de compra, entrega y devolución informadas en la aplicación. Los precios y disponibilidades pueden actualizarse.",
    },
    security: {
      title: "Seguridad",
      text: "Las sesiones se protegen con cookies HTTP-only y la información se transmite dentro del entorno local seguro de la aplicación.",
    },
    rights: {
      title: "Derechos legales",
      text: "Music&Sport DSS, C.A. Todos los derechos reservados. Las marcas y productos mostrados pertenecen a sus respectivos propietarios.",
    },
  };

  const openPaymentInfo = () => {
    setOpenQuestion(1);
    document
      .getElementById("preguntas-frecuentes")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="mt-10">
      <style>{`
        .catalog-footer-heading {
          font-size: 18px;
          line-height: 22px;
          font-weight: 700;
        }
        .catalog-footer-secondary,
        .catalog-footer-secondary * {
          font-size: 12px;
          line-height: 20px;
          font-weight: 400;
        }
      `}</style>
      <section
        id="preguntas-frecuentes"
        className="border-t-8 border-[#000080] bg-white px-4 py-8 sm:px-6 md:py-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className="text-2xl font-black text-[#000080]"
                style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                Preguntas frecuentes
              </h2>
              <p className="text-sm text-gray-600">
                Resuelve tus dudas antes de comprar.
              </p>
            </div>
            <a
              href="#preguntas-frecuentes"
              onClick={(event) => {
                event.preventDefault();
                setOpenQuestion(0);
              }}
              className="self-start rounded-full border-2 border-[#C8102E] px-4 py-2 text-xs font-bold text-[#C8102E] transition-colors hover:bg-[#C8102E] hover:text-white"
            >
              Ver preguntas y respuestas <ArrowRight size={13} className="ml-1 inline" />
            </a>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {questions.map((item, index) => {
              const open = openQuestion === index;
              return (
                <div
                  key={item.question}
                  className="overflow-hidden rounded-md border border-[rgba(0,0,128,0.2)]"
                >
                  <button
                    onClick={() => setOpenQuestion(open ? null : index)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs text-[#000080] hover:bg-[#f4f5f7]"
                    aria-expanded={open}
                  >
                    <span>{item.question}</span>
                    <span className="text-base leading-none text-[#C8102E]">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && (
                    <p className="border-t border-[rgba(0,0,128,0.12)] px-3 py-2 text-xs leading-relaxed text-gray-600">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#000080] px-4 py-9 text-white sm:px-6 md:py-10">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="Music&Sport"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p
                  className="text-xl font-black leading-none"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  MUSIC&amp;SPORT
                </p>
                <p className="mt-1 text-[10px] text-white/60">
                  Equipa tu pasión
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3
              className="catalog-footer-heading"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              Compra
            </h3>
            <div className="catalog-footer-secondary mt-3 space-y-2 text-white/65">
              <button onClick={() => setView("catalog")} className="block hover:text-white">
                Todos los productos
              </button>
              <button onClick={() => setView("client-orders")} className="block hover:text-white">
                Mis órdenes
              </button>
              <button onClick={() => setView("cart")} className="flex items-center gap-1 hover:text-white">
                <ShoppingCart size={12} /> Mi carrito
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3
              className="catalog-footer-heading"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              Ayuda
            </h3>
            <div className="catalog-footer-secondary mt-3 space-y-2 text-white/65">
              <a href="#preguntas-frecuentes" className="block hover:text-white">
                Preguntas frecuentes
              </a>
              <a href="mailto:soporte@musicsport.com" className="block hover:text-white">
                Atención al cliente
              </a>
              <button onClick={openPaymentInfo} className="block hover:text-white">
                Métodos de pago
              </button>
              <button onClick={() => setOpenQuestion(2)} className="block hover:text-white">
                Devoluciones y reembolsos
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3
              className="catalog-footer-heading"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              Empresa
            </h3>
            <div className="catalog-footer-secondary mt-3 space-y-2 text-white/65">
              <button onClick={() => setView("catalog")} className="block hover:text-white">
                Nosotros
              </button>
              <a href="mailto:soporte@musicsport.com" className="block hover:text-white">
                soporte@musicsport.com
              </a>
              <p>RIF J-50123456-7</p>
              <p>Lun–Sáb · 8:00–18:00</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3
              className="catalog-footer-heading"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              Legal
            </h3>
            <div className="catalog-footer-secondary mt-3 space-y-2 text-white/65">
              <button onClick={() => setLegalDocument("privacy")} className="block hover:text-white">
                Política de privacidad
              </button>
              <button onClick={() => setLegalDocument("terms")} className="block hover:text-white">
                Términos y condiciones
              </button>
              <button onClick={() => setLegalDocument("security")} className="block hover:text-white">
                Seguridad
              </button>
              <button onClick={() => setLegalDocument("rights")} className="block hover:text-white">
                Derechos legales
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/15 pt-4 text-[11px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Music&amp;Sport DSS, C.A. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3 text-white/75" aria-label="Compra segura">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} /> Compra segura
            </span>
            <Lock size={14} aria-label="Pago protegido" />
          </div>
        </div>
      </section>

      {legalDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-title"
          onMouseDown={() => setLegalDocument(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="legal-title"
                className="text-xl font-black text-[#000080]"
                style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {legalContent[legalDocument].title}
              </h2>
              <button
                onClick={() => setLegalDocument(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {legalContent[legalDocument].text}
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}
