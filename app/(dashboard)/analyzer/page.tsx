"use client";

import { useState } from "react";
import { CameraCapture } from "@/components/analyzer/CameraCapture";
import {
  HazardResultPanel,
  type DetectionBox,
  type DetectionSummary,
} from "@/components/analyzer/HazardResultPanel";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Hazard Analyzer (khusus Inspector) — kamera real-time / upload gambar di
 * kiri, panel hasil deteksi di kanan. State deteksi diangkat ke sini supaya
 * kotak yang digambar CameraCapture dan status di HazardResultPanel selalu
 * sinkron (keduanya sumber datanya sama: hasil backend).
 */
export default function AnalyzerPage() {
  const { t } = useLang();
  // null = belum ada deteksi dijalankan; [] = sudah jalan, area aman.
  const [detections, setDetections] = useState<DetectionBox[] | null>(null);
  // Ringkasan mentah (person/helmet/vest) — supaya panel bisa membedakan
  // "Present" dari "No person".
  const [summary, setSummary] = useState<DetectionSummary | null>(null);
  // Area yang dipilih untuk menentukan PPE requirements
  const [area, setArea] = useState<string>("spray_decoration");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.analyzer.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.analyzer.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CameraCapture 
            onDetections={setDetections} 
            onSummary={setSummary}
            onAreaChange={setArea}
          />
        </div>
        <div className="lg:col-span-4">
          <HazardResultPanel 
            detections={detections} 
            summary={summary}
            area={area}
          />
        </div>
      </div>
    </div>
  );
}
