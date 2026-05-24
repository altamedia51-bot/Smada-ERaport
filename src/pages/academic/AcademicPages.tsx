import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  FileCheck,
  Search,
  Printer,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import { mockClasses, mockSubjects } from "../../store/mockDb";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as XLSX from "xlsx";

const StudentRow: React.FC<{
  student: any;
  idx: number;
  activeFormatives: any[];
  activeSummatives: any[];
  gradeData: any;
  onChange: (newData: any) => void;
}> = ({
  student,
  idx,
  activeFormatives,
  activeSummatives,
  gradeData,
  onChange,
}) => {
  const data = gradeData || {};

  const formatives = [...(data.formatives || [])];
  while (formatives.length < activeFormatives.length) formatives.push("");

  const summatives = [...(data.summatives || [])];
  while (summatives.length < activeSummatives.length) summatives.push("");

  const ptsAsli = data.ptsAsli !== undefined ? data.ptsAsli : "";
  const ptsAkhir = data.ptsAkhir !== undefined ? data.ptsAkhir : "";
  const psasAsli = data.psasAsli !== undefined ? data.psasAsli : "";
  const psasAkhir = data.psasAkhir !== undefined ? data.psasAkhir : "";
  const deskripsi = data.deskripsi !== undefined ? data.deskripsi : "";

  const getNum = (v: string) => parseFloat(v) || 0;

  const sumF = formatives.reduce(
    (acc: number, v: string) => acc + getNum(v),
    0,
  );
  const avgF = formatives.length > 0 ? sumF / formatives.length : 0;

  const sumS = summatives.reduce(
    (acc: number, v: string) => acc + getNum(v),
    0,
  );
  const avgS = summatives.length > 0 ? sumS / summatives.length : 0;

  let totalParts = 0;
  let totalScore = 0;

  if (activeFormatives.length > 0) {
    totalParts++;
    totalScore += avgF;
  }
  if (activeSummatives.length > 0) {
    totalParts++;
    totalScore += avgS;
  }

  const pA = getNum(ptsAkhir);
  const psA = getNum(psasAkhir);

  if (pA > 0) {
    totalParts++;
    totalScore += pA;
  }
  if (psA > 0) {
    totalParts++;
    totalScore += psA;
  }

  const nilaiRaport = totalParts > 0 ? Math.round(totalScore / totalParts) : 0;

  const clamp = (val: string) => {
    if (val === "") return "";
    let curr = parseInt(val, 10);
    if (isNaN(curr)) return "0";
    if (curr > 100) return "100";
    if (curr < 0) return "0";
    return String(curr);
  };

  const handleChange = (field: string, value: any) => {
    onChange({
      ...data,
      formatives,
      summatives,
      ptsAsli,
      ptsAkhir,
      psasAsli,
      psasAkhir,
      deskripsi,
      [field]: value,
    });
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 border-r border-slate-100 text-center text-slate-500 font-medium">
        {idx + 1}
      </td>
      <td className="px-4 py-3 border-r border-slate-100">
        <div className="font-semibold text-slate-800">{student.name}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {student.nis || "NIS belum diatur"}
        </div>
      </td>
      {activeFormatives.map((f, i) => (
        <td
          key={f.label}
          className="px-1.5 py-2 border-r border-slate-100 text-center"
        >
          <input
            type="number"
            min="0"
            max="100"
            value={formatives[i] || ""}
            onChange={(e) => {
              const newF = [...formatives];
              newF[i] = clamp(e.target.value);
              handleChange("formatives", newF);
            }}
            className="w-14 h-9 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
          />
        </td>
      ))}
      {activeSummatives.map((s, i) => (
        <td
          key={s.label}
          className="px-1.5 py-2 border-r border-slate-100 text-center bg-slate-50/50"
        >
          <input
            type="number"
            min="0"
            max="100"
            value={summatives[i] || ""}
            onChange={(e) => {
              const newS = [...summatives];
              newS[i] = clamp(e.target.value);
              handleChange("summatives", newS);
            }}
            className="w-14 h-9 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-shadow"
          />
        </td>
      ))}
      <td className="px-1.5 py-2 border-r border-slate-100 text-center">
        <input
          type="number"
          min="0"
          max="100"
          value={ptsAsli}
          onChange={(e) => handleChange("ptsAsli", clamp(e.target.value))}
          className="w-14 h-9 text-center text-sm border border-slate-200 rounded focus:border-slate-500 outline-none text-slate-700 bg-white"
        />
      </td>
      <td className="px-1.5 py-2 border-r border-slate-100 text-center">
        <input
          type="number"
          min="0"
          max="100"
          value={ptsAkhir}
          onChange={(e) => handleChange("ptsAkhir", clamp(e.target.value))}
          className="w-14 h-9 text-center text-sm border border-amber-200 rounded focus:border-amber-500 outline-none font-bold text-blue-600 bg-amber-50/30 transition-shadow"
        />
      </td>
      <td className="px-1.5 py-2 border-r border-slate-100 text-center">
        <input
          type="number"
          min="0"
          max="100"
          value={psasAsli}
          onChange={(e) => handleChange("psasAsli", clamp(e.target.value))}
          className="w-14 h-9 text-center text-sm border border-slate-200 rounded focus:border-slate-500 outline-none text-slate-700 bg-white"
        />
      </td>
      <td className="px-1.5 py-2 border-r border-slate-100 text-center">
        <input
          type="number"
          min="0"
          max="100"
          value={psasAkhir}
          onChange={(e) => handleChange("psasAkhir", clamp(e.target.value))}
          className="w-14 h-9 text-center text-sm border border-emerald-200 rounded focus:border-emerald-500 outline-none font-bold text-blue-600 bg-emerald-50/30 transition-shadow"
        />
      </td>
      <td className="px-4 py-3 border-r border-slate-100 text-center font-bold text-lg text-emerald-600 bg-emerald-50/40">
        {nilaiRaport}
      </td>
      <td className="px-4 py-3 min-w-[300px]">
        <textarea
          className="w-full text-xs text-slate-600 border border-slate-200 rounded p-2 focus:border-blue-500 outline-none resize-none transition-shadow leading-relaxed"
          rows={2}
          value={deskripsi}
          onChange={(e) => handleChange("deskripsi", e.target.value)}
        />
      </td>
    </tr>
  );
};

export function InputNilai() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Capaian Pembelajaran states
  const [formatives, setFormatives] = useState([
    "bab 1",
    "bab 2",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [summatives, setSummatives] = useState([
    "bab 1",
    "bab 2",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  // Conversion states
  const [ptsConv, setPtsConv] = useState({ min: 70, max: 92 });
  const [psasConv, setPsasConv] = useState({ min: 70, max: 92 });

  const [isSaving, setIsSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [studentGrades, setStudentGrades] = useState<Record<string, any>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const displayClasses = classesList.length > 0 ? classesList : mockClasses;
    const classStudents = students.filter(
      (s) => s.classId === (selectedClass || displayClasses[0]?.id),
    );
    const activeFormatives = formatives
      .map((val, idx) => ({ val, label: `F${idx + 1}` }))
      .filter((f) => f.val.trim() !== "");
    const activeSummatives = summatives
      .map((val, idx) => ({ val, label: `S${idx + 1}` }))
      .filter((s) => s.val.trim() !== "");

    const wsData = [
      [
        "NIS",
        "Nama Siswa",
        ...activeFormatives.map((f) => f.label),
        ...activeSummatives.map((s) => s.label),
        "PTS Asli",
        "PTS Akhir",
        "PSAS Asli",
        "PSAS Akhir",
        "Deskripsi Capaian",
      ],
    ];

    classStudents.forEach((s) => {
      wsData.push([
        s.nis || "",
        s.name,
        ...activeFormatives.map(() => "80"),
        ...activeSummatives.map(() => "80"),
        "75",
        "92",
        "60",
        "80",
        "Menunjukkan penguasaan yang baik.",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Nilai");
    XLSX.writeFile(wb, `Template_Nilai_Akademik.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const displayClasses = classesList.length > 0 ? classesList : mockClasses;
    const classStudents = students.filter(
      (s) => s.classId === (selectedClass || displayClasses[0]?.id),
    );
    const activeFormatives = formatives
      .map((val, idx) => ({ val, label: `F${idx + 1}` }))
      .filter((f) => f.val.trim() !== "");
    const activeSummatives = summatives
      .map((val, idx) => ({ val, label: `S${idx + 1}` }))
      .filter((s) => s.val.trim() !== "");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const newGrades = { ...studentGrades };

        data.forEach((row: any) => {
          let studentObj;
          const rowNis = String(row["NIS"] || "").trim();
          const rowName = String(row["Nama Siswa"] || "").trim();

          if (rowNis) {
            studentObj = classStudents.find((s) => s.nis === rowNis);
          }
          if (!studentObj && rowName) {
            studentObj = classStudents.find((s) => s.name === rowName);
          }

          if (studentObj) {
            const fs = [];
            for (let i = 1; i <= activeFormatives.length; i++) {
              fs.push(String(row[`F${i}`] || "0"));
            }
            const ss = [];
            for (let i = 1; i <= activeSummatives.length; i++) {
              ss.push(String(row[`S${i}`] || "0"));
            }

            newGrades[studentObj.id] = {
              formatives: fs,
              summatives: ss,
              ptsAsli: String(row["PTS Asli"] || "0"),
              ptsAkhir: String(row["PTS Akhir"] || "0"),
              psasAsli: String(row["PSAS Asli"] || "0"),
              psasAkhir: String(row["PSAS Akhir"] || "0"),
              deskripsi: String(row["Deskripsi Capaian"] || ""),
            };
          }
        });

        setStudentGrades(newGrades);
        alert(
          `Berhasil mengimpor data ke tampilan form. Klik Simpan Perubahan untuk menyimpan ke server.`,
        );
      } catch (error) {
        alert("Gagal membaca file Excel");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearGrades = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowClearConfirm(true);
  };

  const confirmClearGrades = () => {
    const emptyGrades: Record<string, any> = {};
    const displayClasses = classesList.length > 0 ? classesList : mockClasses;
    const classStudents = students.filter(
      (s) => s.classId === (selectedClass || displayClasses[0]?.id),
    );
    classStudents.forEach((s) => {
      emptyGrades[s.id] = {
        formatives: formatives.map(() => ""),
        summatives: summatives.map(() => ""),
        ptsAsli: "",
        ptsAkhir: "",
        psasAsli: "",
        psasAkhir: "",
        deskripsi: "",
      };
    });
    setStudentGrades({ ...studentGrades, ...emptyGrades });
    setShowClearConfirm(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      if (selectedClass && selectedSubject) {
        const configRef = doc(
          db,
          "academic_configs",
          `${selectedClass}_${selectedSubject}`,
        );
        batch.set(
          configRef,
          {
            formatives,
            summatives,
            classId: selectedClass,
            subjectId: selectedSubject,
          },
          { merge: true },
        );
      }

      const displayClasses = classesList.length > 0 ? classesList : mockClasses;
      const classStudentsList = students.filter(
        (s) => s.classId === (selectedClass || displayClasses[0]?.id),
      );
      const activeF = formatives
        .map((val, idx) => ({ val, label: `F${idx + 1}` }))
        .filter((f) => f.val.trim() !== "");
      const activeS = summatives
        .map((val, idx) => ({ val, label: `S${idx + 1}` }))
        .filter((s) => s.val.trim() !== "");

      classStudentsList.forEach((student) => {
        const ref = doc(
          db,
          "academic_grades",
          `${student.id}_${selectedSubject}`,
        );
        const data = studentGrades[student.id] || {};

        const fs = [...(data.formatives || [])];
        while (fs.length < activeF.length) fs.push("");

        const ss = [...(data.summatives || [])];
        while (ss.length < activeS.length) ss.push("");

        batch.set(
          ref,
          {
            studentId: student.id,
            subjectId: selectedSubject,
            formatives: fs,
            summatives: ss,
            ptsAsli: data.ptsAsli !== undefined ? data.ptsAsli : "",
            ptsAkhir: data.ptsAkhir !== undefined ? data.ptsAkhir : "",
            psasAsli: data.psasAsli !== undefined ? data.psasAsli : "",
            psasAkhir: data.psasAkhir !== undefined ? data.psasAkhir : "",
            deskripsi: data.deskripsi !== undefined ? data.deskripsi : "",
          },
          { merge: true },
        );
      });

      await batch.commit();
      alert("Perubahan nilai berhasil disimpan ke server!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan nilai");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const qStudents = query(collection(db, "students"));
    const unsubscribeStudents = onSnapshot(qStudents, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    });

    const qClasses = query(collection(db, "classes"));
    const unsubscribeClasses = onSnapshot(qClasses, (querySnapshot) => {
      const classesData: any[] = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() });
      });
      classesData.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
      setClassesList(classesData);
      if (classesData.length > 0 && !selectedClass) {
        setSelectedClass(classesData[0].id);
      }
    });

    const qSubjects = query(collection(db, "subjects"));
    const unsubscribeSubjects = onSnapshot(qSubjects, (querySnapshot) => {
      const subjectsData: any[] = [];
      querySnapshot.forEach((doc) => {
        subjectsData.push({ id: doc.id, ...doc.data() });
      });
      subjectsData.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
      setSubjectsList(subjectsData);
      if (subjectsData.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectsData[0].id);
      }
    });

    let unsubscribeGrades = () => {};
    if (selectedSubject) {
      const qGrades = query(collection(db, "academic_grades"));
      unsubscribeGrades = onSnapshot(qGrades, (querySnapshot) => {
        const grades: Record<string, any> = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.subjectId === selectedSubject) {
            grades[data.studentId] = data;
          }
        });
        setStudentGrades(grades);
      });
    }

    let unsubscribeConfig = () => {};
    if (selectedClass && selectedSubject) {
      const docRef = doc(
        db,
        "academic_configs",
        `${selectedClass}_${selectedSubject}`,
      );
      unsubscribeConfig = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.formatives) setFormatives(data.formatives);
          if (data.summatives) setSummatives(data.summatives);
        } else {
          setFormatives(["bab 1", "bab 2", "", "", "", "", "", ""]);
          setSummatives(["bab 1", "bab 2", "", "", "", "", "", ""]);
        }
      });
    }

    return () => {
      unsubscribeStudents();
      unsubscribeClasses();
      unsubscribeSubjects();
      unsubscribeGrades();
      unsubscribeConfig();
    };
  }, [selectedClass, selectedSubject]);

  const displayClasses = classesList.length > 0 ? classesList : mockClasses;
  const displaySubjects = subjectsList.length > 0 ? subjectsList : mockSubjects;

  const classStudents = students.filter(
    (s) => s.classId === (selectedClass || displayClasses[0]?.id),
  );

  const activeFormatives = formatives
    .map((val, idx) => ({ val, label: `F${idx + 1}` }))
    .filter((f) => f.val.trim() !== "");
  const activeSummatives = summatives
    .map((val, idx) => ({ val, label: `S${idx + 1}` }))
    .filter((s) => s.val.trim() !== "");

  const handleFormativeChange = (idx: number, val: string) => {
    const newArr = [...formatives];
    newArr[idx] = val;
    setFormatives(newArr);
  };
  const handleSummativeChange = (idx: number, val: string) => {
    const newArr = [...summatives];
    newArr[idx] = val;
    setSummatives(newArr);
  };

  const handleConvertPTS = () => {
    const newGrades = { ...studentGrades };

    let actualMin = 100,
      actualMax = 0;
    classStudents.forEach((s) => {
      const grades = newGrades[s.id] || {};
      const pts = parseFloat(
        grades.ptsAsli !== undefined ? String(grades.ptsAsli) : "75",
      );
      if (pts < actualMin) actualMin = pts;
      if (pts > actualMax) actualMax = pts;
    });

    if (actualMax === actualMin) {
      actualMin = 0;
      actualMax = 100;
    }

    classStudents.forEach((s) => {
      const grades = newGrades[s.id] || {};
      const ptsAsli = parseFloat(
        grades.ptsAsli !== undefined ? String(grades.ptsAsli) : "75",
      );
      let converted = Math.round(
        ptsConv.min +
          ((ptsAsli - actualMin) / (actualMax - actualMin)) *
            (ptsConv.max - ptsConv.min),
      );
      if (isNaN(converted)) converted = ptsConv.min;

      newGrades[s.id] = {
        ...grades,
        ptsAsli: String(ptsAsli),
        ptsAkhir: String(converted),
      };
    });
    setStudentGrades(newGrades);
    alert(
      "Konversi PTS berhasil diterapkan di tabel (Klik Simpan untuk permanen).",
    );
  };

  const handleConvertPSAS = () => {
    const newGrades = { ...studentGrades };

    let actualMin = 100,
      actualMax = 0;
    classStudents.forEach((s) => {
      const grades = newGrades[s.id] || {};
      const psas = parseFloat(
        grades.psasAsli !== undefined ? String(grades.psasAsli) : "60",
      );
      if (psas < actualMin) actualMin = psas;
      if (psas > actualMax) actualMax = psas;
    });

    if (actualMax === actualMin) {
      actualMin = 0;
      actualMax = 100;
    }

    classStudents.forEach((s) => {
      const grades = newGrades[s.id] || {};
      const psasAsli = parseFloat(
        grades.psasAsli !== undefined ? String(grades.psasAsli) : "60",
      );
      let converted = Math.round(
        psasConv.min +
          ((psasAsli - actualMin) / (actualMax - actualMin)) *
            (psasConv.max - psasConv.min),
      );
      if (isNaN(converted)) converted = psasConv.min;

      newGrades[s.id] = {
        ...grades,
        psasAsli: String(psasAsli),
        psasAkhir: String(converted),
      };
    });
    setStudentGrades(newGrades);
    alert(
      "Konversi PSAS berhasil diterapkan di tabel (Klik Simpan untuk permanen).",
    );
  };

  return (
    <div className="space-y-6">
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full mx-4 shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Kosongkan Nilai?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Apakah Anda yakin ingin mengosongkan semua form nilai untuk kelas
              dan mapel ini?
              <br />
              <br />
              <span className="text-amber-600 font-semibold bg-amber-50 p-2 rounded block">
                Peringatan: Anda akan mereset form ke kosong. Anda tetap perlu
                mengklik tombol "Simpan Perubahan" untuk menyimpan ke server.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={confirmClearGrades}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm"
              >
                Ya, Kosongkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Parameters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            Filter & Parameter Akademik
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Tahun Ajaran
            </label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700">
              <option>2025/2026</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Semester
            </label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700">
              <option>Ganjil</option>
              <option>Genap</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700"
            >
              {displaySubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700"
            >
              {displayClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 bg-white px-3 py-1 inline-block rounded border border-slate-200">
            Capaian Pembelajaran (Mempengaruhi Kolom Nilai yang Muncul)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-blue-600 uppercase mb-3">
                Materi / TP Formatif
              </h4>
              {formatives.map((val, i) => (
                <div key={`f-${i}`} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 w-6">
                    F{i + 1}
                  </span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFormativeChange(i, e.target.value)}
                    placeholder={`Deskripsi Materi Formatif ${i + 1}`}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-purple-600 uppercase mb-3">
                Materi / TP Sumatif
              </h4>
              {summatives.map((val, i) => (
                <div key={`s-${i}`} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 w-6">
                    S{i + 1}
                  </span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleSummativeChange(i, e.target.value)}
                    placeholder={`Deskripsi Materi Sumatif ${i + 1}`}
                    className="flex-1 px-3 py-1.5 text-sm border border-purple-200 bg-purple-50/30 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-4 items-center">
            <div className="text-xs font-bold text-amber-700 uppercase">
              Konversi Nilai PTS
            </div>
            <input
              type="number"
              value={ptsConv.min}
              onChange={(e) =>
                setPtsConv({ ...ptsConv, min: parseInt(e.target.value) || 0 })
              }
              className="w-16 px-2 py-1 text-center border border-amber-200 rounded text-sm bg-white"
            />
            <span className="text-amber-500">-</span>
            <input
              type="number"
              value={ptsConv.max}
              onChange={(e) =>
                setPtsConv({ ...ptsConv, max: parseInt(e.target.value) || 0 })
              }
              className="w-16 px-2 py-1 text-center border border-amber-200 rounded text-sm bg-white"
            />
            <button
              onClick={handleConvertPTS}
              className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700"
            >
              Proses
            </button>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-4 items-center">
            <div className="text-xs font-bold text-emerald-700 uppercase">
              Konversi Nilai PSAS
            </div>
            <input
              type="number"
              value={psasConv.min}
              onChange={(e) =>
                setPsasConv({ ...psasConv, min: parseInt(e.target.value) || 0 })
              }
              className="w-16 px-2 py-1 text-center border border-emerald-200 rounded text-sm bg-white"
            />
            <span className="text-emerald-500">-</span>
            <input
              type="number"
              value={psasConv.max}
              onChange={(e) =>
                setPsasConv({ ...psasConv, max: parseInt(e.target.value) || 0 })
              }
              className="w-16 px-2 py-1 text-center border border-emerald-200 rounded text-sm bg-white"
            />
            <button
              onClick={handleConvertPSAS}
              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700"
            >
              Proses
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <button
            onClick={handleClearGrades}
            className="px-4 py-2 flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100"
          >
            <Trash2 size={16} />
            Kosongkan Nilai
          </button>
          <button className="px-4 py-2 flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100">
            Generate Deskripsi
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100"
          >
            <Download size={16} />
            Template Excel
          </button>
          <div>
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImportExcel}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-semibold hover:bg-orange-100"
            >
              <Upload size={16} />
              Import Excel
            </button>
          </div>
        </div>
        <div>
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-75"
          >
            <Save size={18} />
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left align-middle whitespace-nowrap">
            <thead className="text-[10px] font-bold text-slate-600 uppercase bg-slate-50 border-b border-slate-200 text-center">
              <tr>
                <th
                  className="px-4 py-3 border-r border-slate-200 w-12"
                  rowSpan={2}
                >
                  No
                </th>
                <th
                  className="px-4 py-3 border-r border-slate-200 text-left min-w-[200px]"
                  rowSpan={2}
                >
                  Nama Siswa
                </th>
                {activeFormatives.length > 0 && (
                  <th
                    className="px-2 py-2 border-r border-slate-200 text-blue-600"
                    colSpan={activeFormatives.length}
                  >
                    Formatif
                  </th>
                )}
                {activeSummatives.length > 0 && (
                  <th
                    className="px-2 py-2 border-r border-slate-200 text-purple-600"
                    colSpan={activeSummatives.length}
                  >
                    Sumatif
                  </th>
                )}
                <th
                  className="px-2 py-2 border-r border-slate-200 text-amber-600"
                  colSpan={2}
                >
                  PTS
                </th>
                <th
                  className="px-2 py-2 border-r border-slate-200 text-emerald-600"
                  colSpan={2}
                >
                  PSAS
                </th>
                <th
                  className="px-4 py-3 border-r border-slate-200 whitespace-wrap w-24"
                  rowSpan={2}
                >
                  Nilai Raport
                </th>
                <th className="px-4 py-3 text-left w-96" rowSpan={2}>
                  Deskripsi Capaian
                </th>
              </tr>
              <tr>
                {activeFormatives.map((f) => (
                  <th
                    key={f.label}
                    className="px-2 py-2 border-r border-slate-200 text-slate-500 font-semibold"
                    title={f.val}
                  >
                    {f.label}
                  </th>
                ))}
                {activeSummatives.map((s) => (
                  <th
                    key={s.label}
                    className="px-2 py-2 border-r border-slate-200 text-slate-500 font-semibold"
                    title={s.val}
                  >
                    {s.label}
                  </th>
                ))}
                <th className="px-2 py-2 border-r border-slate-200 text-slate-400 font-medium">
                  Nilai Asli
                </th>
                <th className="px-2 py-2 border-r border-slate-200 text-slate-400 font-medium">
                  Nilai Akhir
                </th>
                <th className="px-2 py-2 border-r border-slate-200 text-slate-400 font-medium">
                  Nilai Asli
                </th>
                <th className="px-2 py-2 border-r border-slate-200 text-slate-400 font-medium">
                  Nilai Akhir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.map((s, idx) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  idx={idx}
                  activeFormatives={activeFormatives}
                  activeSummatives={activeSummatives}
                  gradeData={studentGrades[s.id]}
                  onChange={(newData) =>
                    setStudentGrades({ ...studentGrades, [s.id]: newData })
                  }
                />
              ))}
              {classStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      10 + activeFormatives.length + activeSummatives.length
                    }
                    className="px-6 py-12 text-center text-slate-500 bg-slate-50/50"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Search size={32} className="text-slate-300 mb-3" />
                      <p className="font-medium">
                        Tidak ada data siswa ditemukan di kelas ini
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Silakan pilih kelas lain atau tambahkan siswa di menu
                        Data Siswa
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function InputKehadiran() {
  const selectedClass = mockClasses[0].id;
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "students"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setStudents(studentsData);
    });
    return () => unsubscribe();
  }, []);

  const classStudents = students.filter((s) => s.classId === selectedClass);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Kehadiran & Catatan Wali Kelas
        </h2>
        <p className="text-sm text-slate-500">Kelas: X MIPA 1</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 border border-slate-200">
          <thead className="text-xs text-center text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                className="px-4 py-3 border-r border-slate-200 w-12"
                rowSpan={2}
              >
                No
              </th>
              <th
                className="px-4 py-3 border-r border-slate-200 text-left"
                rowSpan={2}
              >
                Nama Siswa
              </th>
              <th className="px-4 py-2 border-b border-slate-200" colSpan={3}>
                Kehadiran
              </th>
              <th
                className="px-4 py-3 border-l border-slate-200 text-left"
                rowSpan={2}
              >
                Catatan Wali Kelas
              </th>
            </tr>
            <tr>
              <th className="px-2 py-2 border-r border-slate-200">Sakit</th>
              <th className="px-2 py-2 border-r border-slate-200">Izin</th>
              <th className="px-2 py-2 border-r border-slate-200">Alpha</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s, idx) => (
              <tr
                key={s.id}
                className="bg-white border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-2 border-r border-slate-100 text-center">
                  {idx + 1}
                </td>
                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-900">
                  {s.name}
                </td>
                <td className="px-2 py-2 border-r border-slate-100">
                  <input
                    type="number"
                    className="w-12 p-1 border border-slate-200 rounded text-center"
                    defaultValue={0}
                  />
                </td>
                <td className="px-2 py-2 border-r border-slate-100">
                  <input
                    type="number"
                    className="w-12 p-1 border border-slate-200 rounded text-center"
                    defaultValue={0}
                  />
                </td>
                <td className="px-2 py-2 border-r border-slate-100">
                  <input
                    type="number"
                    className="w-12 p-1 border border-slate-200 rounded text-center"
                    defaultValue={0}
                  />
                </td>
                <td className="px-4 py-2 border-l border-slate-100">
                  <textarea
                    className="w-full p-2 border border-slate-200 rounded text-sm"
                    rows={2}
                    placeholder="Tulis catatan..."
                  ></textarea>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => alert("Data kehadiran dan catatan berhasil disimpan!")}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <Save size={18} />
          Simpan Data
        </button>
      </div>
    </div>
  );
}

export function CetakRaport() {
  const [students, setStudents] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    const unsubStudents = onSnapshot(
      query(collection(db, "students")),
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setStudents(arr);
      },
    );
    const unsubClasses = onSnapshot(
      query(collection(db, "classes")),
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setClassesList(arr);
      },
    );
    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, []);

  const displayClasses = classesList.length > 0 ? classesList : mockClasses;
  const currentClassId = selectedClass || displayClasses[0]?.id;
  const classObj = displayClasses.find((c) => c.id === currentClassId);
  const classStudents = students.filter((s) => s.classId === currentClassId);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cetak Raport</h2>
          <p className="text-sm text-slate-500">
            Pilih kelas dan preview/cetak data raport siswa
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={currentClassId}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
          >
            {displayClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto print:hidden">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">NIS/NISN</th>
              <th className="px-6 py-3">Nama Siswa</th>
              <th className="px-6 py-3">Status Validasi</th>
              <th className="px-6 py-3 text-right">Aksi Cetak</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s) => (
              <tr
                key={s.id}
                className="bg-white border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {s.nis}
                </td>
                <td className="px-6 py-4">{s.name}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                    <FileCheck size={14} /> Siap Cetak
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium text-xs"
                  >
                    <Printer size={14} /> Cetak Raport
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden print:block p-8 border-2 border-black">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase">RAPORT PESERTA DIDIK</h1>
          <h2 className="text-xl font-bold uppercase">
            KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET DAN TEKNOLOGI
          </h2>
          <p className="mt-4 font-bold">REPUBLIK INDONESIA</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p>
              <strong>Nama Sekolah:</strong> SMA Negeri 1 Template
            </p>
            <p>
              <strong>Alamat:</strong> Jl. Pendidikan No.1
            </p>
            <p>
              <strong>Nama Peserta Didik:</strong> {classStudents[0]?.name}
            </p>
          </div>
          <div>
            <p>
              <strong>Kelas:</strong> {classObj?.name || mockClasses[0].name}
            </p>
            <p>
              <strong>Fase/Semester:</strong> E / Genap
            </p>
            <p>
              <strong>Tahun Pelajaran:</strong> 2023/2024
            </p>
          </div>
        </div>
        <table className="w-full text-sm border-collapse border border-black mb-8">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 w-12 text-center">No</th>
              <th className="border border-black p-2">Mata Pelajaran</th>
              <th className="border border-black p-2 w-24 text-center">
                Nilai Akhir
              </th>
              <th className="border border-black p-2 text-center">
                Capaian Kompetensi
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 text-center">1</td>
              <td className="border border-black p-2">
                Pendidikan Agama & Budi Pekerti
              </td>
              <td className="border border-black p-2 text-center font-bold">
                85
              </td>
              <td className="border border-black p-2 text-xs">
                Menunjukkan penguasaan yang sangat baik dalam memahami konsep
                norma dan etika.
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 text-center">2</td>
              <td className="border border-black p-2">Pendidikan Pancasila</td>
              <td className="border border-black p-2 text-center font-bold">
                88
              </td>
              <td className="border border-black p-2 text-xs">
                Sangat baik dalam mengamati dinamika musyawarah.
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 text-center">3</td>
              <td className="border border-black p-2">Matematika</td>
              <td className="border border-black p-2 text-center font-bold">
                82.5
              </td>
              <td className="border border-black p-2 text-xs">
                Sangat baik dalam pemahaman konsep geometri.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between mt-16 pt-8">
          <div className="text-center w-48">
            <p>Mengetahui,</p>
            <p className="mb-16">Orang Tua/Wali</p>
            <p className="border-b border-black inline-block w-40">
              ({classStudents[0]?.name})
            </p>
          </div>
          <div className="text-center w-48">
            <p>Jakarta, 20 Mei 2024</p>
            <p className="mb-16">Wali Kelas</p>
            <p className="font-bold underline">Budi Santoso, S.Pd</p>
            <p>NIP. 198001012005011001</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CetakDKN() {
  const [students, setStudents] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, any>>({});
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    const unsubStudents = onSnapshot(
      query(collection(db, "students")),
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setStudents(arr);
      },
    );
    const unsubClasses = onSnapshot(
      query(collection(db, "classes")),
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setClassesList(arr);
      },
    );
    const unsubSubjects = onSnapshot(
      query(collection(db, "subjects")),
      (snap) => {
        const arr: any[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || "")),
        );
        setSubjectsList(arr);
      },
    );
    const unsubGrades = onSnapshot(
      query(collection(db, "academic_grades")),
      (snap) => {
        const g: Record<string, any> = {};
        snap.forEach((d) => {
          const data = d.data();
          if (!g[data.studentId]) g[data.studentId] = {};
          g[data.studentId][data.subjectId] = data;
        });
        setGrades(g);
      },
    );
    return () => {
      unsubStudents();
      unsubClasses();
      unsubSubjects();
      unsubGrades();
    };
  }, []);

  const displayClasses = classesList.length > 0 ? classesList : mockClasses;
  const currentClassId = selectedClass || displayClasses[0]?.id;
  const classObj = displayClasses.find((c) => c.id === currentClassId);
  const classStudents = students.filter((s) => s.classId === currentClassId);

  const calculateNilai = (gradeDoc: any) => {
    if (!gradeDoc) return 0;
    const fs = gradeDoc.formatives || [];
    const ss = gradeDoc.summatives || [];
    const getNum = (v: string) => parseFloat(v) || 0;
    const sumF = fs.reduce((acc: number, v: string) => acc + getNum(v), 0);
    const avgF = fs.length > 0 ? sumF / fs.length : 0;
    const sumS = ss.reduce((acc: number, v: string) => acc + getNum(v), 0);
    const avgS = ss.length > 0 ? sumS / ss.length : 0;
    let ts = 0,
      tp = 0;
    if (avgF > 0) {
      tp++;
      ts += avgF;
    }
    if (avgS > 0) {
      tp++;
      ts += avgS;
    }
    const pa = getNum(gradeDoc.ptsAkhir);
    const psa = getNum(gradeDoc.psasAkhir);
    if (pa > 0) {
      tp++;
      ts += pa;
    }
    if (psa > 0) {
      tp++;
      ts += psa;
    }
    return tp > 0 ? Math.round(ts / tp) : 0;
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const baseSubjects = subjectsList.length > 0 ? subjectsList : mockSubjects;

  const tempDknData = classStudents.map((student) => {
    const subjScores = baseSubjects.map((sub) => {
      const stdGrades = grades[student.id] || {};
      const gradeDoc = stdGrades[sub.id];
      return { subId: sub.id, score: calculateNilai(gradeDoc) };
    });
    return { ...student, subjScores };
  });

  const displaySubjects = baseSubjects.filter((sub) => {
    return tempDknData.some((std) => {
      const sObj = std.subjScores.find((x) => x.subId === sub.id);
      return sObj && sObj.score > 0;
    });
  });

  const dknData = classStudents.map((student, idx) => {
    const stdTemp = tempDknData[idx];
    const subjScores = displaySubjects.map((sub) => {
      const sObj = stdTemp.subjScores.find((x) => x.subId === sub.id);
      return { subId: sub.id, score: sObj ? sObj.score : 0 };
    });
    const total = subjScores.reduce((acc, s) => acc + s.score, 0);
    const avg = subjScores.length > 0 ? total / subjScores.length : 0;
    return { ...student, subjScores, total, avg };
  });

  const sortedForRank = [...dknData].sort((a, b) => b.total - a.total);
  const finalDKNData = dknData.map((s) => {
    const rank = sortedForRank.findIndex((x) => x.id === s.id) + 1;
    return { ...s, rank };
  });

  const subjectStats = displaySubjects.map((sub) => {
    const scores = finalDKNData
      .map((s) => s.subjScores.find((x) => x.subId === sub.id)?.score || 0)
      .filter((v) => v > 0);
    if (scores.length === 0)
      return { subId: sub.id, min: 0, max: 0, avg: 0, sd: 0 };
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sd = Math.sqrt(
      scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length,
    );
    return {
      subId: sub.id,
      min,
      max,
      avg: parseFloat(avg.toFixed(1)),
      sd: parseFloat(sd.toFixed(1)),
    };
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Cetak Daftar Kumpulan Nilai (DKN)
          </h2>
          <p className="text-sm text-slate-500">
            Pilih kelas untuk melihat dan mencetak DKN
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={currentClassId}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
          >
            {displayClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
          >
            <Printer size={18} />
            Cetak DKN Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white print:overflow-visible">
        <div
          className="min-w-max p-4 print:p-0"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold uppercase mb-4 tracking-wider">
                DAFTAR KUMPULAN NILAI RAPOR
              </h1>
              <div className="grid grid-cols-[100px_10px_auto] gap-y-1 text-xs whitespace-nowrap font-medium">
                <div>Sekolah</div>
                <div>:</div>
                <div>SMA DARUSSALAM</div>
                <div>Alamat</div>
                <div>:</div>
                <div>Jln. Pon-Pes Darussalam Blokagung</div>
              </div>
            </div>
            <div className="grid grid-cols-[100px_10px_auto] gap-y-1 text-xs whitespace-nowrap font-medium mr-12 mt-10">
              <div>Kelas</div>
              <div>:</div>
              <div>{classObj?.name || "-"}</div>
              <div>Fase</div>
              <div>:</div>
              <div>E</div>
            </div>
            <div className="grid grid-cols-[100px_10px_auto] gap-y-1 text-xs whitespace-nowrap font-medium mt-10">
              <div>Semester</div>
              <div>:</div>
              <div>1</div>
              <div>Tahun Pelj.</div>
              <div>:</div>
              <div>1 (Satu)</div>
            </div>
          </div>

          <table className="text-xs border-collapse border border-black w-full min-w-max bg-white">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-center w-8 bg-gray-50 uppercase min-w-[30px]"
                >
                  No
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-center bg-gray-50 uppercase min-w-[60px]"
                >
                  NIS/NISN
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-2 text-center bg-gray-50 uppercase min-w-[200px]"
                >
                  Nama
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-center w-8 bg-gray-50 min-w-[30px] font-normal"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  L/P
                </th>
                <th
                  colSpan={Math.max(1, displaySubjects.length)}
                  className="border border-black p-1 text-center bg-gray-50 uppercase"
                >
                  Mata Pelajaran
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-center w-12 bg-gray-50 min-w-[40px] font-normal"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  Jumlah
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-center w-12 bg-gray-50 min-w-[40px] font-normal"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  Rerata
                </th>
                <th
                  rowSpan={2}
                  className="border border-black p-1 text-center w-12 bg-gray-50 min-w-[40px] font-normal"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  Ranking
                </th>
              </tr>
              <tr>
                {displaySubjects.length > 0 ? (
                  displaySubjects.map((sub) => (
                    <th
                      key={sub.id}
                      className="border border-black p-1 font-normal text-center min-w-[30px] max-w-[30px] h-24 truncate align-bottom bg-gray-50"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {sub.name.substring(0, 4)}
                    </th>
                  ))
                ) : (
                  <th className="border border-black p-1 bg-gray-50 text-slate-400 font-normal italic">
                    -
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {finalDKNData.map((std, i) => (
                <tr key={std.id}>
                  <td className="border border-black p-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {std.nis || "-"}
                  </td>
                  <td className="border border-black p-1 px-2 whitespace-nowrap max-w-[200px] truncate">
                    {std.name.toUpperCase()}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {std.gender || "L"}
                  </td>
                  {displaySubjects.length > 0 ? (
                    displaySubjects.map((sub) => {
                      const sObj = std.subjScores.find(
                        (x) => x.subId === sub.id,
                      );
                      return (
                        <td
                          key={sub.id}
                          className="border border-black p-1 text-center font-medium"
                        >
                          {sObj && sObj.score > 0 ? sObj.score : ""}
                        </td>
                      );
                    })
                  ) : (
                    <td className="border border-black p-1 text-center bg-gray-50/20"></td>
                  )}
                  <td className="border border-black p-1 text-center font-bold bg-gray-50/50">
                    {std.total > 0 ? std.total : ""}
                  </td>
                  <td className="border border-black p-1 text-center font-bold">
                    {std.avg > 0 ? parseFloat(std.avg.toFixed(1)) : ""}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {std.total > 0 ? std.rank : ""}
                  </td>
                </tr>
              ))}
              {/* Statistics rows */}
              <tr className="font-bold">
                <td
                  colSpan={4}
                  className="border border-black p-1 px-2 text-right"
                >
                  Nilai Terendah
                </td>
                {displaySubjects.length > 0 ? (
                  subjectStats.map((stat) => (
                    <td
                      key={stat.subId}
                      className="border border-black p-1 text-center bg-gray-50/50"
                    >
                      {stat.min > 0 ? stat.min : ""}
                    </td>
                  ))
                ) : (
                  <td className="border border-black p-1 bg-gray-50/50"></td>
                )}
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
              </tr>
              <tr className="font-bold">
                <td
                  colSpan={4}
                  className="border border-black p-1 px-2 text-right"
                >
                  Nilai Tertinggi
                </td>
                {displaySubjects.length > 0 ? (
                  subjectStats.map((stat) => (
                    <td
                      key={stat.subId}
                      className="border border-black p-1 text-center bg-gray-50/50"
                    >
                      {stat.max > 0 ? stat.max : ""}
                    </td>
                  ))
                ) : (
                  <td className="border border-black p-1 bg-gray-50/50"></td>
                )}
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
              </tr>
              <tr className="font-bold">
                <td
                  colSpan={4}
                  className="border border-black p-1 px-2 text-right"
                >
                  Rata-rata Nilai
                </td>
                {displaySubjects.length > 0 ? (
                  subjectStats.map((stat) => (
                    <td
                      key={stat.subId}
                      className="border border-black p-1 text-center bg-gray-50/50"
                    >
                      {stat.avg > 0 ? stat.avg : ""}
                    </td>
                  ))
                ) : (
                  <td className="border border-black p-1 bg-gray-50/50"></td>
                )}
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
              </tr>
              <tr className="font-bold">
                <td
                  colSpan={4}
                  className="border border-black p-1 px-2 text-right"
                >
                  Standar Deviasi
                </td>
                {displaySubjects.length > 0 ? (
                  subjectStats.map((stat) => (
                    <td
                      key={stat.subId}
                      className="border border-black p-1 text-center bg-gray-50/50"
                    >
                      {stat.sd > 0 ? stat.sd : ""}
                    </td>
                  ))
                ) : (
                  <td className="border border-black p-1 bg-gray-50/50"></td>
                )}
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
                <td className="border border-black p-1 text-center"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
