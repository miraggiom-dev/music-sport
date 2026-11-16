import { useState } from "react";
import { ArrowRight } from "lucide-react";
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

  return (
    <footer className="mt-10">
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

      <section className="bg-[#000080] px-4 py-8 text-white sm:px-6 md:py-10">
        <div className="max-w-7xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="" className="h-10 w-10 rounded-full object-cover" />
              <span className="text-lg font-black">MUSIC &amp; SPORT</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/75">
              Equipa tu pasión. Compra música y deportes en un solo lugar.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Catálogo</h3>
            <button
              onClick={() => setView("catalog")}
              className="mt-2 block text-left text-xs text-white/75 hover:text-white"
            >
              Todos los productos
            </button>
          </div>
          <div>
            <h3 className="text-sm font-bold">Ayuda</h3>
            <p className="mt-2 text-xs text-white/75">Compra segura y atención personalizada.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Contacto</h3>
            <p className="mt-2 text-xs text-white/75">soporte@musicsport.com</p>
            <p className="mt-1 text-xs text-white/75">Lun–Sáb · 8:00–18:00</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 border-t border-white/15 pt-4 text-center text-[11px] text-white/50">
          © 2026 Music&amp;Sport DSS, C.A. · Todos los derechos reservados
        </div>
      </section>
    </footer>
  );
}
