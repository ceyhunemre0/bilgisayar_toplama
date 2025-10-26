"use client";
import {
  CPU,
  Motherboard,
  RAM,
  GPU,
  Cooler,
  Storage,
  Case,
  PSU,
  Monitor,
  Keyboard,
  Mouse,
  SelectedParts,
} from "@/app/types/parts";

import rawCpus from "@/data/islemci.json";
import rawMotherboards from "@/data/anakart.json";
import rawRams from "@/data/ram.json";
import rawGpus from "@/data/ekran_karti.json";
import rawCoolers from "@/data/islemci_sogutucu.json";
import rawStorages from "@/data/depolama.json";
import rawCases from "@/data/kasa.json";
import rawPsus from "@/data/psu.json";
import rawMonitors from "@/data/monitor.json";
import rawKeyboards from "@/data/klavye.json";
import rawMice from "@/data/fare.json";
import { useState, useMemo } from "react";

export const cpusData = rawCpus as CPU[];
export const motherboardsData = rawMotherboards as Motherboard[];
export const ramsData = rawRams as unknown as RAM[];
export const gpusData = rawGpus as unknown as GPU[];
export const coolersData = rawCoolers as Cooler[];
export const storagesData = rawStorages as Storage[];
export const casesData = rawCases as Case[];
export const psusData = rawPsus as unknown as PSU[];
export const monitorsData = rawMonitors as Monitor[];
export const keyboardsData = rawKeyboards as Keyboard[];
export const miceData = rawMice as Mouse[];

export default function PartSelectorWizard() {
  const steps = [
    "motherboard",
    "cpu",
    "ram",
    "gpu",
    "cooler",
    "storage",
    "case",
    "psu",
    "monitor",
    "keyboard",
    "mouse",
  ] as const;

  type Step = (typeof steps)[number];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selected, setSelected] = useState<SelectedParts>({
    cpu: null,
    motherboard: null,
    ram: null,
    gpu: null,
    cooler: null,
    storage: null,
    case: null,
    psu: null,
    monitor: null,
    keyboard: null,
    mouse: null,
  });

  const currentStep = steps[currentStepIndex];

  // Uyumluluk yardımcıları
  function filterForStep(step: Step) {
    switch (step) {
      case "motherboard":
        return motherboardsData;
      case "cpu":
        return cpusData.filter((cpu) => {
          const m = selected.motherboard;
          if (!m) return true;
          const socketMatch = cpu.soket === (m.soket as string);
          const genMatch = m.cpu_uyumluluk?.nesiller?.length
            ? m.cpu_uyumluluk.nesiller.includes(cpu.nesil)
            : true;
          return socketMatch && genMatch;
        });
      case "ram":
        return ramsData.filter((ram) => {
          const m = selected.motherboard;
          if (!m) return true;
          return ram.tip === m.bellek.tip;
        });
      case "gpu":
        return gpusData.filter((gpu) => {
          const c = selected.case;
          const p = selected.psu;
          // Kasa içi GPU uzunluğu ve varsa PSU önerilen güç değerine göre filtreleme
          if (c && gpu.boyut?.uzunluk_mm != null) {
            if (
              c.gpu_uzunluk_max_mm != null &&
              gpu.boyut.uzunluk_mm > c.gpu_uzunluk_max_mm
            )
              return false;
          }
          if (p && gpu.guc?.onerilen_psu_w != null) {
            if (p.guc_w < gpu.guc.onerilen_psu_w) return false;
          }
          return true;
        });
      case "cooler":
        return coolersData.filter((cooler) => {
          const m = selected.motherboard;
          const cpu = selected.cpu;
          if (!m) return true;
          // Soğutucunun anakart soketini desteklemesi gerekir
          if (
            cooler.desteklenen_soketler &&
            !cooler.desteklenen_soketler.includes(m.soket)
          )
            return false;
          if (cpu && cooler.max_tdp_w != null) {
            if (cooler.max_tdp_w < cpu.tdp_w) return false;
          }
          return true;
        });
      case "storage":
        return storagesData;
      case "case":
        return casesData.filter((cs) => {
          const m = selected.motherboard;
          const g = selected.gpu;
          const cooler = selected.cooler;
          if (m && cs.mobo_destek) {
            if (!cs.mobo_destek.includes(m.form_factor)) return false;
          }
          if (
            g &&
            g.boyut?.uzunluk_mm != null &&
            cs.gpu_uzunluk_max_mm != null
          ) {
            if (g.boyut.uzunluk_mm > cs.gpu_uzunluk_max_mm) return false;
          }
          if (
            cooler &&
            cooler.yukseklik_mm != null &&
            cs.cpu_sogutucu_yukseklik_max_mm != null
          ) {
            if (cooler.yukseklik_mm > cs.cpu_sogutucu_yukseklik_max_mm)
              return false;
          }
          return true;
        });
      case "psu":
        return psusData.filter((p) => {
          const cpu = selected.cpu;
          const gpu = selected.gpu;
          let required = 0;
          if (cpu) required += cpu.tdp_w || 0;
          if (gpu && gpu.guc?.onerilen_psu_w)
            required += gpu.guc.onerilen_psu_w;
          // Bir miktar güvenlik payı ekle
          required = Math.ceil(required * 1.2);
          if (p.guc_w < required) return false;
          // GPU belirli güç konnektörleri gerektiriyorsa PSU bağlantılarını kontrol et
          if (gpu && gpu.guc?.ek_guc_baglantisi?.length) {
            for (const conn of gpu.guc.ek_guc_baglantisi) {
              if (
                conn.includes("12pin") &&
                (p.baglantilar?.pcie_12pin_adet || 0) <= 0
              )
                return false;
              if (
                conn.includes("8pin") &&
                (p.baglantilar?.pcie_8pin_adet || 0) <= 0
              )
                return false;
            }
          }
          return true;
        });
      case "monitor":
        return monitorsData;
      case "keyboard":
        return keyboardsData;
      case "mouse":
        return miceData;
      default:
        return [] as any;
    }
  }

  const available = useMemo(
    () => filterForStep(currentStep),
    [currentStep, selected]
  );

  function selectPart(step: Step, part: any | null) {
    setSelected((prev) => ({ ...prev, [step]: part }));
  }

  function next() {
    if (currentStepIndex < steps.length - 1) setCurrentStepIndex((i) => i + 1);
  }

  function prev() {
    if (currentStepIndex > 0) setCurrentStepIndex((i) => i - 1);
  }

  // Adım etiketleri (Türkçe)
  const stepLabels: Record<Step, string> = {
    motherboard: "Anakart",
    cpu: "İşlemci",
    ram: "RAM",
    gpu: "Ekran Kartı",
    cooler: "Soğutucu",
    storage: "Depolama",
    case: "Kasa",
    psu: "Güç Kaynağı",
    monitor: "Monitör",
    keyboard: "Klavye",
    mouse: "Fare",
  };

  // Toplam fiyatı hesapla
  const totalPrice = useMemo(() => {
    return Object.values(selected).reduce((sum, part) => {
      return sum + (part?.fiyat_try || 0);
    }, 0);
  }, [selected]);

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
  {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bilgisayarını Topla
          </h1>
          <p className="text-gray-600">
            Hayalindeki bilgisayarı adım adım oluştur
          </p>
        </div>

  {/* İlerleme Çubuğu */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">İlerleme</span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, idx) => (
              <div
                key={step}
                className={`text-xs ${
                  idx <= currentStepIndex
                    ? "text-blue-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                {idx === currentStepIndex && "●"}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Ana İçerik */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Adım Başlığı */}
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">
                      Adım {currentStepIndex + 1} / {steps.length}
                    </div>
                    <h2 className="text-2xl font-bold">
                      {stepLabels[currentStep]}
                    </h2>
                  </div>
                  <div className="text-5xl opacity-20">
                    {currentStep === "motherboard" && "🔌"}
                    {currentStep === "cpu" && "🧠"}
                    {currentStep === "ram" && "💾"}
                    {currentStep === "gpu" && "🎮"}
                    {currentStep === "cooler" && "❄️"}
                    {currentStep === "storage" && "💿"}
                    {currentStep === "case" && "📦"}
                    {currentStep === "psu" && "⚡"}
                    {currentStep === "monitor" && "🖥️"}
                    {currentStep === "keyboard" && "⌨️"}
                    {currentStep === "mouse" && "🖱️"}
                  </div>
                </div>
              </div>

              {/* Ürün Izgarası */}
              <div className="p-6">
                {available.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-5xl mb-4">😔</div>
                    <p className="text-gray-600">Uyumlu ürün bulunamadı</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Önceki seçimlerinizi kontrol edin
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {available.map((p: any) => {
                      const isSelected =
                        (selected as any)[currentStep]?.id === p.id;
                      const outOfStock = p.stok?.durum !== "in_stock";
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={outOfStock ? -1 : 0}
                          onClick={() => {
                            if (!outOfStock)
                              selectPart(currentStep, isSelected ? null : p);
                          }}
                          onKeyDown={(e) => {
                            if (
                              !outOfStock &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              selectPart(currentStep, isSelected ? null : p);
                            }
                          }}
                          className={`
                                                        relative group p-5 rounded-lg border-2 transition-all duration-200
                                                        ${
                                                          outOfStock
                                                            ? "border-gray-200 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed"
                                                            : "cursor-pointer hover:scale-105 " +
                                                              (isSelected
                                                                ? "border-blue-500 bg-blue-50 shadow-lg"
                                                                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md")
                                                        }
                                                    `}
                          aria-disabled={outOfStock}
                        >
                          {isSelected && !outOfStock && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                          <div className="mb-3">
                            <h3
                              className={`font-semibold text-sm mb-1 line-clamp-2 ${
                                outOfStock ? "text-gray-400" : "text-gray-900"
                              }`}
                            >
                              {p.ad || `${p.marka || ""} ${p.model || ""}`}
                            </h3>
                            {p.marka && (
                              <p
                                className={`text-xs ${
                                  outOfStock ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {p.marka}
                              </p>
                            )}
                          </div>
                          <div className="flex items-end justify-between">
                            <div
                              className={`text-lg font-bold ${
                                outOfStock ? "text-gray-400" : "text-blue-600"
                              }`}
                            >
                              {p.fiyat_try
                                ? `${p.fiyat_try.toLocaleString("tr-TR")} ₺`
                                : "Fiyat yok"}
                            </div>
                            {p.stok?.durum === "in_stock" ? (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Stokta
                              </span>
                            ) : (
                              <span className="text-xs text-red-600 font-bold">
                                ✗ Tükendi
                              </span>
                            )}
                          </div>
                          {outOfStock && (
                            <div className="absolute inset-0 bg-gray-100 opacity-40 rounded-lg pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gezinme */}
              <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                <button
                  onClick={prev}
                  disabled={currentStepIndex === 0}
                  className="px-6 py-2.5 rounded-lg font-medium transition-colors
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:hover:bg-gray-200"
                >
                  ← Geri
                </button>

                <div className="text-sm text-gray-600">
                  {(selected as any)[currentStep] ? (
                    <span className="text-green-600 font-medium">
                      ✓ Seçildi
                    </span>
                  ) : (
                    <span>Bir ürün seçin</span>
                  )}
                </div>

                <button
                  onClick={next}
                  disabled={currentStepIndex === steps.length - 1}
                  className="px-6 py-2.5 rounded-lg font-medium transition-colors
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
                >
                  İleri →
                </button>
              </div>
            </div>
          </div>

          {/* Yan Panel - Toplama Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-4">
              <div className="bg-linear-to-r from-slate-700 to-slate-800 px-5 py-4 text-white">
                <h3 className="font-bold text-lg">Seçimleriniz</h3>
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto">
                <div className="space-y-3">
                  {steps.map((step) => {
                    const part = (selected as any)[step];
                    const isPast = steps.indexOf(step) < currentStepIndex;
                    const isCurrent = step === currentStep;

                    return (
                      <div
                        key={step}
                        className={`
                                                    p-3 rounded-lg border transition-all
                                                    ${
                                                      isCurrent
                                                        ? "border-blue-400 bg-blue-50"
                                                        : "border-gray-200"
                                                    }
                                                    ${
                                                      isPast && !part
                                                        ? "opacity-50"
                                                        : ""
                                                    }
                                                `}
                      >
                        <div className="text-xs font-semibold text-gray-600 mb-1 uppercase">
                          {stepLabels[step]}
                        </div>
                        {part ? (
                          <>
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">
                              {part.ad || part.model}
                            </div>
                            <div className="text-xs font-bold text-blue-600 mt-1">
                              {part.fiyat_try?.toLocaleString("tr-TR")} ₺
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Seçilmedi
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toplam Fiyat */}
              <div className="border-t bg-linear-to-br from-green-50 to-emerald-50 px-5 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    Toplam
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {totalPrice.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                {totalPrice > 0 && (
                  <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors">
                    Sepete Ekle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
