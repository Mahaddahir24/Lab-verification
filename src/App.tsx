import React, { useState, useEffect, useRef } from "react";

import { motion, AnimatePresence } from "motion/react";

// @ts-ignore

import html2pdf from "html2pdf.js";

import {

  ShieldCheck,

  Search,

  Printer,

  QrCode,

  Plus,

  Check,

  X,

  ShieldAlert,

  FileText,

  User,

  Calendar,

  Shield,

  RefreshCw,

  Eye,

  Building,

  Phone,

  Stethoscope,

  Info,

  Layers,

  Sparkles,

  FileDown,

  MapPin,

  ChevronRight

} from "lucide-react";

import { PatientReport, LabTest } from "./types";

import { INITIAL_REPORTS } from "./data";



export default function App() {

  // Load reports from LocalStorage or use preloaded dataset

  const [reports, setReports] = useState<PatientReport[]>(() => {

    const saved = localStorage.getItem("medilab_reports");

    if (saved) {

      try {

        return JSON.parse(saved);

      } catch (e) {

        console.error("Error parsing stored reports, using defaults.", e);

      }

    }

    return INITIAL_REPORTS;

  });



  // Save to LocalStorage whenever reports change

  useEffect(() => {

    localStorage.setItem("medilab_reports", JSON.stringify(reports));

  }, [reports]);



  // Terminal States

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedReportId, setSelectedReportId] = useState("1876");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [stampUrl, setStampUrl] = useState("");

  const [customBaseUrl, setCustomBaseUrl] = useState("https://mymedilabscom.vercel.app");



  // Simulated Verification Authenticity Override (to show unverified states)

  const [verificationOverride, setVerificationOverride] = useState<Record<string, boolean>>({});

  const [isExporting, setIsExporting] = useState(false);



  // Form State for creating a new report

  const [newPatient, setNewPatient] = useState({

    id: "",

    boono: "",

    name: "",

    age: 35,

    gender: "Male" as "Male" | "Female" | "Other",

    company: "",

    passportNo: "",

    phone: "",

    doctor: "sadam adan Ahmed",

    resultDate: new Date().toISOString().split("T")[0],

    hcv: "Negative",

    hepB: "Negative",

    hiv: "Negative",

    tpha: "Negative"

  });



  // Read Query Parameter on Mount & dynamic changes (e.g., QR scanner deep links)

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);

    const queryId = params.get("id");

    const queryPassport = params.get("passport");

    const queryToken = params.get("token");



    if (queryToken) {

      const match = reports.find((r) => r.token === queryToken);

      if (match) {

        setSelectedReportId(match.id);

      }

    } else if (queryId) {

      const match = reports.find((r) => r.id === queryId);

      if (match) {

        setSelectedReportId(queryId);

      }

    } else if (queryPassport) {

      const match = reports.find(

        (r) => r.passportNo.toLowerCase() === queryPassport.toLowerCase()

      );

      if (match) {

        setSelectedReportId(match.id);

      }

    }

  }, [reports]);



  // Handle setting parameters to support physical link testing directly

  const updateUrlParam = (report: PatientReport) => {

    const newUrl = `${window.location.origin}${window.location.pathname}?token=${report.token || "a3b8899c3a"}`;

    window.history.replaceState({ path: newUrl }, "", newUrl);

  };



  const handleSelectReport = (id: string) => {

    setSelectedReportId(id);

    const match = reports.find((r) => r.id === id);

    if (match) {

      updateUrlParam(match);

    }

  };



  // Find dynamic patient active report

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];



  // Check if active report is verified

  const isCurrentlyVerified = activeReport

    ? verificationOverride[activeReport.id] !== false && activeReport.verified

    : false;



  const getAvatarColors = (name: string) => {

    const norm = (name || "").toUpperCase();

    if (norm.includes("MYKOLA")) {

      return { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" };

    } else if (norm.includes("SERGEY")) {

      return { bg: "bg-[#ecfdf5]", text: "text-[#10b981]" };

    } else if (norm.includes("HALIMA")) {

      return { bg: "bg-[#faf5ff]", text: "text-[#a855f7]" };

    } else {

      return { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" };

    }

  };



  // Filter passengers in terminal panel

  const filteredReports = reports.filter((r) => {

    const query = searchQuery.toLowerCase();

    return (

      r.name.toLowerCase().includes(query) ||

      r.id.includes(query) ||

      r.passportNo.toLowerCase().includes(query) ||

      r.company.toLowerCase().includes(query)

    );

  });



  // Calculate stats

  const totalReportsCount = reports.length;

  const verifiedCount = reports.filter((r) => verificationOverride[r.id] !== false && r.verified).length;



  // Dynamic document title update during printing to suggest correct patient name as the PDF filename

  useEffect(() => {

    const handleBeforePrint = () => {

      if (activeReport) {

        document.title = `${activeReport.name.trim().toUpperCase().replace(/\s+/g, " ")}`;

      }

    };

    const handleAfterPrint = () => {

      document.title = "Medilab Diagnostic Center";

    };

    window.addEventListener("beforeprint", handleBeforePrint);

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {

      window.removeEventListener("beforeprint", handleBeforePrint);

      window.removeEventListener("afterprint", handleAfterPrint);

    };

  }, [activeReport]);



  const handlePrint = () => {

    const originalTitle = document.title;

    if (activeReport) {

      document.title = `${activeReport.name.trim().toUpperCase().replace(/\s+/g, " ")}`;

    }

    window.print();

    setTimeout(() => {

      document.title = originalTitle;

    }, 1000);

  };



  const handleDownloadPDF = () => {

    const element = document.getElementById("laboratory-report-sheet");

    if (!element || !activeReport) return;



    setIsExporting(true);



    const filename = `${activeReport.name.trim().toUpperCase().replace(/\s+/g, " ")}.pdf`;



    // 1. Create a unique clone of our report sheet

    const clone = element.cloneNode(true) as HTMLElement;



    // 2. Wrap the clone inside a temporary absolute off-screen container.

    // This detaches the layout scaling from any narrow screen viewports or sidebar constraints.

    const container = document.createElement("div");

    container.style.position = "absolute";

    container.style.left = "-9999px";

    container.style.top = "0";

    container.style.width = "800px";

    container.style.background = "#ffffff";

    container.style.color = "#000000";



    container.appendChild(clone);

    document.body.appendChild(container);

    // 3. Force clean inline styles on the clone suited for pristine single A4 page capture

    clone.style.width = "800px";

    clone.style.maxWidth = "800px";

    clone.style.minHeight = "auto"; // size naturally with the report contents

    clone.style.boxShadow = "none";

    clone.style.borderRadius = "0";

    clone.style.border = "none";

    clone.style.padding = "35px";

    clone.style.margin = "0";

    clone.style.background = "#ffffff";



    const opt = {

      margin:       0, // Zero margin fits built-in 35px padding edge-to-edge beautifully

      filename:     filename,

      image:        { type: "jpeg", quality: 0.98 },

      html2canvas:  { 

        scale: 2, 

        useCORS: true, 

        logging: false,

        letterRendering: true,

        allowTaint: true,

        windowWidth: 800, // Forces html2canvas to render the clone in simulated 800px width

        scrollX: 0,

        scrollY: 0

      },

      jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" }

    };



    const exporter = (html2pdf as any).default || html2pdf;



    exporter()

      .set(opt)

      .from(clone)

      .save()

      .then(() => {

        // Clean up elements from DOM comfortably

        if (document.body.contains(container)) {

          document.body.removeChild(container);

        }

        setIsExporting(false);

      })

      .catch((error: any) => {

        console.error("PDF generation failed:", error);

        if (document.body.contains(container)) {

          document.body.removeChild(container);

        }

        setIsExporting(false);

      });

  };



  const resetToFactoryDefault = () => {

    if (confirm("Miyaad la hubtaa inaad dib u dhigto dhammaan diiwaannada Medilab? (Are you sure you want to reset records to original preloaded defaults?)")) {

      setReports(INITIAL_REPORTS);

      setVerificationOverride({});

      setSelectedReportId("1876");

      const cleanUrl = `${window.location.origin}${window.location.pathname}`;

      window.history.replaceState({ path: cleanUrl }, "", cleanUrl);

    }

  };



  const handleCreateReportSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    if (!newPatient.id || !newPatient.name) {

      alert("Fadlan qor lambarka boortada iyo magaca (Please write the Patient ID and Name)");

      return;

    }



    // Check duplicate ID

    if (reports.some((r) => r.id === newPatient.id)) {

      alert("Lambarka ID-ga ee bukaanka mar hore ayaa la isticmaalay! (This Patient ID already exists!)");

      return;

    }



    const created: PatientReport = {

      id: newPatient.id,

      boono: newPatient.boono.trim() || newPatient.id,

      name: newPatient.name.toUpperCase(),

      age: Number(newPatient.age),

      gender: newPatient.gender,

      company: newPatient.company.toUpperCase() || "PRIVATE CO",

      passportNo: newPatient.passportNo.toUpperCase() || "N/A",

      phone: newPatient.phone || "N/A",

      doctor: newPatient.doctor,

      resultDate: newPatient.resultDate,
