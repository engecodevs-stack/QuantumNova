import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  Presentation,
  Upload,
  Download,
  X,
  Trash2,
  ChevronDown,
  Edit3,
  Copy as DuplicateIcon,
  Settings2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import type { Community, User, QuizQuestion, CommunityExam, StudentSubmission, TeacherMaterial } from '../types';
import { getApiUrl } from '../config/api';

interface TeacherPortalViewProps {
  currentUser: User | null;
  theme?: 'dark' | 'light';
}

type TabType = 'community' | 'materials' | 'exams' | 'control' | 'submissions';

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({
  currentUser
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('community');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);

  // Filter states
  const [materialsFilter, setMaterialsFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  // New community modal
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [showNewCommModal, setShowNewCommModal] = useState(false);

  // Edit community modal
  const [showEditCommModal, setShowEditCommModal] = useState(false);
  const [editCommName, setEditCommName] = useState('');
  const [editCommDesc, setEditCommDesc] = useState('');

  // New material modal
  const [matTitle, setMatTitle] = useState('');
  const [matCategory, setMatCategory] = useState<'presentacion' | 'material' | 'apuntes' | 'actividad'>('presentacion');
  const [matContent, setMatContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string; dataUrl: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showNewMatModal, setShowNewMatModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail material modal
  const [viewingMaterial, setViewingMaterial] = useState<TeacherMaterial | null>(null);

  // Create exam modal
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lockNotesOnExam, setLockNotesOnExam] = useState(true);

  // Edit exam modal
  const [editingExam, setEditingExam] = useState<CommunityExam | null>(null);
  const [editExamTitle, setEditExamTitle] = useState('');
  const [editExamDesc, setEditExamDesc] = useState('');
  const [editExamDuration, setEditExamDuration] = useState(20);
  const [editExamLock, setEditExamLock] = useState(true);

  // Grade submission modal
  const [reviewingSub, setReviewingSub] = useState<StudentSubmission | null>(null);
  const [reviewGrade, setReviewGrade] = useState<number | ''>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCommunityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCommunities = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(getApiUrl('/teacher/communities'), {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
        if (data.length > 0) {
          if (!selectedCommunity) {
            setSelectedCommunity(data[0]);
          } else {
            const currentId = selectedCommunity._id || selectedCommunity.id;
            const updated = data.find((c: Community) => (c._id || c.id) === currentId);
            if (updated) setSelectedCommunity(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching teacher communities:', err);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [currentUser]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Código ${code} copiado`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCommunity = async () => {
    if (!newCommName.trim()) {
      showToast('Ingresa el nombre de la comunidad');
      return;
    }
    try {
      const res = await fetch(getApiUrl('/teacher/communities'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          name: newCommName,
          description: newCommDesc
        })
      });
      if (res.ok) {
        const created = await res.json();
        setCommunities(prev => [created, ...prev]);
        setSelectedCommunity(created);
        setNewCommName('');
        setNewCommDesc('');
        setShowNewCommModal(false);
        showToast(`Comunidad "${created.name}" creada`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al crear comunidad');
    }
  };

  const handleOpenEditCommunity = () => {
    if (!selectedCommunity) return;
    setEditCommName(selectedCommunity.name);
    setEditCommDesc(selectedCommunity.description || '');
    setShowEditCommModal(true);
  };

  const handleDeleteCommunity = async (commId?: string, commName?: string) => {
    if (!commId) return;
    const name = commName || 'esta comunidad';
    if (!confirm(`¿Estás seguro de que deseas eliminar la asignatura "${name}"? Esta acción no se puede deshacer y borrará todos los materiales y evaluaciones asociados.`)) {
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}`), {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || '' }
      });
      if (res.ok) {
        showToast(`Comunidad "${name}" eliminada`);
        const remaining = communities.filter(c => (c._id || c.id) !== commId);
        setCommunities(remaining);
        setSelectedCommunity(remaining.length > 0 ? remaining[0] : null);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar la comunidad');
      }
    } catch (err) {
      console.error('Error deleting community:', err);
      alert('Error de conexión al intentar eliminar la comunidad');
    }
  };

  const processSelectedFile = (file: File) => {
    const sizeFormatted = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    if (!matTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setMatTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    if (file.name.match(/\.(pptx|ppt|odp)$/i)) {
      setMatCategory('presentacion');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFile({
        name: file.name,
        size: sizeFormatted,
        type: file.type || 'application/octet-stream',
        dataUrl: result
      });

      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const textReader = new FileReader();
        textReader.onload = (te) => {
          const textContent = te.target?.result as string;
          if (textContent && !matContent.trim()) {
            setMatContent(textContent.slice(0, 5000));
          }
        };
        textReader.readAsText(file);
      } else if (!matContent.trim()) {
        setMatContent(`Presentación impartida en clase: "${file.name}".`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleAddMaterial = async () => {
    if (!selectedCommunity) return;
    if (!matTitle.trim()) {
      showToast('Ingresa un título para el material');
      return;
    }
    if (!matContent.trim() && !uploadedFile) {
      showToast('Sube un archivo o escribe una descripción del tema');
      return;
    }

    const commId = selectedCommunity._id || selectedCommunity.id;
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/materials`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          title: matTitle,
          category: matCategory,
          content: matContent || `Presentación de clase: ${uploadedFile?.name || matTitle}`,
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size,
          fileType: uploadedFile?.type,
          fileData: uploadedFile?.dataUrl
        })
      });
      if (res.ok) {
        const updatedComm = await res.json();
        setSelectedCommunity(updatedComm);
        const upId = updatedComm._id || updatedComm.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? updatedComm : c));
        setMatTitle('');
        setMatContent('');
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowNewMatModal(false);
        showToast('Material publicado correctamente');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al añadir material');
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    if (!selectedCommunity) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    if (!confirm('¿Deseas eliminar este material?')) return;
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/materials/${matId}`), {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || '' }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCommunity(updated);
        const upId = updated._id || updated.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? updated : c));
        showToast('Material eliminado');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar material');
    }
  };

  const handleGenerateExamAI = async () => {
    if (!selectedCommunity) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    const material = selectedCommunity.materials?.find(m => (m._id || m.id) === selectedMatId);
    if (!material) {
      showToast('Selecciona un material de clase');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/generate-exam`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          materialId: material._id || material.id,
          materialTitle: material.title,
          materialContent: `${material.title}\n${material.fileName ? `Archivo: ${material.fileName}\n` : ''}${material.content}`,
          numQuestions: numQuestions
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedQuestions(data.questions || []);
        if (!examTitle) {
          setExamTitle(`Evaluación: ${material.title}`);
        }
        showToast('Preguntas generadas');
      } else {
        showToast('Error al generar preguntas');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExam = async () => {
    if (!selectedCommunity || !generatedQuestions.length) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    if (!examTitle.trim()) {
      showToast('Asigna un título al examen');
      return;
    }
    const material = selectedCommunity.materials?.find(m => (m._id || m.id) === selectedMatId);

    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/exams`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          title: examTitle,
          description: examDesc,
          durationMinutes: 20,
          lockNotesDuringExam: lockNotesOnExam,
          basedOnMaterialTitle: material?.title || 'Contenido de clase',
          questions: generatedQuestions
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCommunity(updated);
        const upId = updated._id || updated.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? updated : c));
        setGeneratedQuestions([]);
        setExamTitle('');
        setExamDesc('');
        setShowCreateExamModal(false);
        setActiveTab('exams');
        showToast('Evaluación creada correctamente');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al guardar examen');
    }
  };

  const handleSetExamStatus = async (examId: string, newStatus: 'activo' | 'pausado' | 'finalizado' | 'borrador') => {
    if (!selectedCommunity) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/exams/${examId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          status: newStatus,
          lockNotesDuringExam: newStatus === 'activo'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCommunity(data.community);
        const upId = data.community._id || data.community.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? data.community : c));
        if (newStatus === 'activo') {
          showToast('Examen activo. Notas de estudiantes bloqueadas.');
        } else if (newStatus === 'pausado') {
          showToast('Examen pausado');
        } else {
          showToast('Examen finalizado. Notas desbloqueadas.');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar estado');
    }
  };

  const handleDuplicateExam = async (examId: string) => {
    if (!selectedCommunity) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/exams/${examId}/duplicate`), {
        method: 'POST',
        headers: { 'x-user-id': currentUser?.id || '' }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCommunity(updated);
        const upId = updated._id || updated.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? updated : c));
        showToast('Evaluación duplicada');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al duplicar');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!selectedCommunity) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    if (!confirm('¿Deseas eliminar esta evaluación?')) return;
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/exams/${examId}`), {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser?.id || '' }
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCommunity(updated);
        const upId = updated._id || updated.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? updated : c));
        showToast('Evaluación eliminada');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar');
    }
  };

  const handleSaveEditExam = async () => {
    if (!selectedCommunity || !editingExam) return;
    const commId = selectedCommunity._id || selectedCommunity.id;
    const examId = editingExam._id || editingExam.id;
    try {
      const res = await fetch(getApiUrl(`/teacher/communities/${commId}/exams/${examId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          title: editExamTitle,
          description: editExamDesc,
          durationMinutes: editExamDuration,
          lockNotesDuringExam: editExamLock
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCommunity(updated);
        const upId = updated._id || updated.id;
        setCommunities(prev => prev.map(c => (c._id || c.id) === upId ? updated : c));
        setEditingExam(null);
        showToast('Evaluación actualizada');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al guardar cambios');
    }
  };

  const handleViewStudentPdf = (sub: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes para ver el documento en PDF.');
      return;
    }

    const formatContentToHtml = (md: string) => {
      let html = md;
      html = html.replace(/<mark\s+class="([^"]+)">\*\*(.*?)\*\*<\/mark>/gi, '<mark class="$1">$2</mark>');
      html = html.replace(/<mark>\*\*(.*?)\*\*<\/mark>/gi, '<mark>$1</mark>');
      html = html.replace(/==(.*?)==/g, '<mark class="orange">$1</mark>');
      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
      html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
      html = html.replace(/`(.*?)`/g, '<code>$1</code>');
      html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
      html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
      html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
      html = html.replace(/<mark\s+class="orange">([\s\S]*?)<\/mark>/gi, 
        '<mark style="background-color: rgba(217, 119, 6, 0.15); color: #D97706; font-weight: 700; padding: 2px 6px; border-radius: 4px; border-bottom: 2px solid #D97706;">$1</mark>');
      html = html.replace(/<mark\s+class="purple">([\s\S]*?)<\/mark>/gi, 
        '<mark style="background-color: rgba(139, 92, 246, 0.15); color: #8B5CF6; font-weight: 700; padding: 2px 6px; border-radius: 4px; border-bottom: 2px solid #8B5CF6;">$1</mark>');
      html = html.replace(/<mark\s+class="blue">([\s\S]*?)<\/mark>/gi, 
        '<mark style="background-color: rgba(79, 111, 234, 0.15); color: #4F6FEA; font-weight: 700; padding: 2px 6px; border-radius: 4px; border-bottom: 2px solid #4F6FEA;">$1</mark>');
      html = html.replace(/<mark\s+class="amber">([\s\S]*?)<\/mark>/gi, 
        '<mark style="background-color: rgba(197, 138, 0, 0.15); color: #C58A00; font-weight: 600; padding: 2px 6px; border-radius: 4px; border-bottom: 2px solid #C58A00;">$1</mark>');
      html = html.replace(/<mark>([\s\S]*?)<\/mark>/gi, 
        '<mark style="background-color: rgba(217, 119, 6, 0.15); color: #D97706; font-weight: 700; padding: 2px 6px; border-radius: 4px;">$1</mark>');
      const blocks = html.split(/\n\n+/);
      return blocks.map(block => {
        const trimmed = block.trim();
        if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<block') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote>')) {
          return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
      }).join('\n');
    };

    const renderedContent = formatContentToHtml(sub.content || '');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${sub.title || 'Entrega Estudiante'} - QuantumNova</title>
        <style>
          @page { margin: 15mm; size: A4; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181F; line-height: 1.6; margin: 0; padding: 25px; background: #FFFFFF; }
          .header { border-bottom: 2px solid #5865F2; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 18px; font-weight: 800; color: #5865F2; letter-spacing: 0.5px; }
          .brand span { color: #A947E8; }
          .meta { font-size: 11px; color: #5F6070; text-align: right; }
          h1 { font-size: 22px; font-weight: 700; color: #18181F; margin: 0 0 10px 0; border-bottom: 1px solid #E1E1EA; padding-bottom: 8px; }
          h2 { font-size: 18px; font-weight: 600; color: #18181F; margin: 16px 0 8px 0; }
          h3 { font-size: 15px; font-weight: 600; color: #18181F; margin: 12px 0 6px 0; }
          .content { font-size: 13px; color: #334155; line-height: 1.7; background: #F7F7FB; padding: 18px; border-radius: 8px; border: 1px solid #E1E1EA; }
          .content p { margin-bottom: 12px; }
          .content ul, .content ol { padding-left: 20px; margin-bottom: 12px; }
          .content li { margin-bottom: 4px; }
          .content blockquote { border-left: 3px solid #A947E8; padding-left: 12px; margin: 12px 0; color: #5F6070; font-style: italic; }
          .content code { font-family: monospace; background: #F3F2F8; padding: 2px 5px; border-radius: 4px; font-size: 12px; border: 1px solid #E1E1EA; }
          .content pre { background: #F3F2F8; border: 1px solid #E1E1EA; border-radius: 8px; padding: 12px; overflow-x: auto; }
          .pedagogic-badge { background: #F7F7FB; border-left: 4px solid #5865F2; padding: 8px 12px; margin-bottom: 18px; font-size: 11px; color: #5F6070; font-style: italic; }
          .footer { margin-top: 40px; border-top: 1px solid #E1E1EA; padding-top: 12px; font-size: 10px; color: #858696; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">QUANTUM<span>NOVA</span></div>
            <div style="font-size: 11px; color: #5F6070; margin-top: 2px;">Entrega Oficial de Apuntes en PDF • Portal Docente</div>
          </div>
          <div class="meta">
            <div><strong>Alumno:</strong> ${sub.studentName}</div>
            <div><strong>Correo:</strong> ${sub.studentEmail}</div>
            <div><strong>Fecha:</strong> ${new Date(sub.submittedAt).toLocaleString()}</div>
          </div>
        </div>
        <div class="pedagogic-badge">
          Apuntes de clase registrados por el alumno para consolidación de aprendizaje.
        </div>
        <h1>${sub.title}</h1>
        <div class="content">${renderedContent}</div>
        <div class="footer">
          Documento académico emitido por QuantumNova Portal Docente
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const studentsCount = selectedCommunity?.students?.length || 0;
  const materialsCount = selectedCommunity?.materials?.length || 0;
  const examsCount = selectedCommunity?.exams?.length || 0;
  const submissionsCount = selectedCommunity?.submissions?.length || 0;

  const filteredMaterials = (selectedCommunity?.materials || []).filter(() => {
    if (materialsFilter === 'published') return true;
    if (materialsFilter === 'draft') return false;
    return true;
  });

  const filteredSubmissions = (selectedCommunity?.submissions || []).filter(s => {
    if (submissionsFilter === 'pending') return typeof s.score !== 'number';
    if (submissionsFilter === 'reviewed') return typeof s.score === 'number';
    return true;
  });

  const tabsConfig = [
    { id: 'community' as TabType, label: 'Comunidad y alumnos' },
    { id: 'materials' as TabType, label: 'Presentaciones y materiales' },
    { id: 'exams' as TabType, label: 'Evaluaciones' },
    { id: 'control' as TabType, label: 'Modo examen' },
    { id: 'submissions' as TabType, label: 'Entregas' }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-bg-primary overflow-y-auto text-text-primary font-sans select-none">
      {/* 1. HEADER LIMPIO E INSTITUCIONAL */}
      <div className="px-8 pt-8 pb-5 bg-bg-secondary/50 border-b border-border-custom shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Gestión Académica y Evaluaciones
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Espacio del profesor: sube presentaciones, crea comunidades privadas y genera exámenes alineados estrictamente con lo visto en clase.
            </p>
          </div>

          <button
            onClick={() => setShowNewCommModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva Comunidad
          </button>
        </div>

        {/* 2. SELECTOR DE COMUNIDAD (DROPDOWN PROFESIONAL CORRECTAMENTE POSICIONADO) */}
        {communities.length > 0 && selectedCommunity && (
          <div className="mt-5 pt-3 border-t border-border-custom flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-text-secondary">
                Comunidad activa:
              </span>

              {/* Contenedor relativo para dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-panel border border-border-custom text-text-primary text-xs font-medium flex items-center gap-2.5 shadow-xs transition-all cursor-pointer hover:border-tech-purple/50"
                >
                  <Users className="w-4 h-4 text-tech-purple shrink-0" />
                  <span className="font-semibold text-text-primary">{selectedCommunity.name}</span>
                  <span className="text-text-tertiary">·</span>
                  <span className="font-mono text-text-secondary text-[11px] bg-bg-secondary px-1.5 py-0.5 rounded border border-border-custom">{selectedCommunity.code}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isCommunityDropdownOpen ? 'rotate-180 text-tech-purple' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isCommunityDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 p-1.5 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl z-50 animate-fade-in space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-text-label px-3 py-1.5">
                      Mis Comunidades
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {communities.map(comm => {
                        const cid = comm._id || comm.id;
                        const selId = selectedCommunity?._id || selectedCommunity?.id;
                        const isSelected = selId === cid;
                        return (
                          <button
                            key={cid}
                            onClick={() => {
                              setSelectedCommunity(comm);
                              setIsCommunityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-tech-purple/10 text-tech-purple font-semibold border border-tech-purple/20'
                                : 'hover:bg-bg-secondary text-text-primary border border-transparent'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate font-semibold text-text-primary">{comm.name}</div>
                              <div className="text-[11px] font-mono text-text-secondary">{comm.code}</div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-tech-purple shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-1.5 border-t border-border-custom mt-1">
                      <button
                        onClick={() => {
                          setIsCommunityDropdownOpen(false);
                          setShowNewCommModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-tech-purple hover:bg-tech-purple/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Crear otra comunidad
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón rápido copiar código */}
              <button
                onClick={() => copyCode(selectedCommunity.code)}
                className="p-2 rounded-xl bg-white dark:bg-panel hover:bg-bg-secondary border border-border-custom text-text-secondary hover:text-text-primary shadow-xs transition-colors cursor-pointer"
                title="Copiar código de comunidad"
              >
                {copiedCode === selectedCommunity.code ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#008A67] border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008A67] dark:bg-emerald-400" />
                Activa
              </span>
              <button
                onClick={handleOpenEditCommunity}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-panel hover:bg-bg-secondary border border-border-custom text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Settings2 className="w-3.5 h-3.5 text-text-secondary" />
                Administrar
              </button>
              <button
                onClick={() => handleDeleteCommunity(selectedCommunity._id || selectedCommunity.id, selectedCommunity.name)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-panel hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Eliminar esta asignatura / aula"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Eliminar Asignatura</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. PESTAÑAS PRINCIPALES (NAVEGACIÓN INTERNA LIMPIA) */}
      <div className="px-8 border-b border-border-custom bg-white dark:bg-panel shrink-0">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none" aria-label="Pestañas">
          {tabsConfig.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-medium border-b-2 tab-apple transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-tech-purple text-text-primary font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-custom'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. CONTENIDO ÚNICAMENTE DE LA PESTAÑA SELECCIONADA */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* =========================================================================
            PESTAÑA 1: COMUNIDAD Y ALUMNOS (INICIAL)
            ========================================================================= */}
        {activeTab === 'community' && (
          <div className="space-y-6 max-w-5xl ios-tab-panel">
            {selectedCommunity ? (
              <>
                {/* Tarjeta horizontal de comunidad docente */}
                <div className="p-5 rounded-xl bg-white dark:bg-panel border border-slate-200 dark:border-border-custom shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Comunidad docente
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Activa
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedCommunity.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedCommunity.description || 'Comunidad académica oficial para impartir clases y evaluar estudiantes.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-bg-primary border border-slate-200 dark:border-border-custom shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                        Código de invitación
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                        {selectedCommunity.code}
                      </span>
                    </div>
                    <button
                      onClick={() => copyCode(selectedCommunity.code)}
                      className="px-3 py-1.5 rounded-md bg-white dark:bg-panel hover:bg-slate-100 dark:hover:bg-panel/80 border border-slate-300 dark:border-border-custom text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar código</span>
                    </button>
                  </div>
                </div>

                {/* 3 Estadísticas compactas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-panel border border-slate-200 dark:border-border-custom shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                        {studentsCount}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Alumnos inscritos
                      </div>
                    </div>
                    <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-panel border border-slate-200 dark:border-border-custom shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                        {materialsCount}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Presentaciones
                      </div>
                    </div>
                    <Presentation className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-panel border border-slate-200 dark:border-border-custom shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                        {examsCount}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Evaluaciones
                      </div>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                {/* Tarjeta Alumnos en la comunidad */}
                <div className="rounded-xl bg-white dark:bg-panel border border-slate-200 dark:border-border-custom shadow-xs overflow-hidden">
                  <div className="p-4 px-5 border-b border-slate-200 dark:border-border-custom flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Alumnos en la comunidad
                      </h3>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        ({studentsCount})
                      </span>
                    </div>
                    <button
                      onClick={() => copyCode(selectedCommunity.code)}
                      className="text-xs font-medium text-tech-purple hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar código de invitación
                    </button>
                  </div>

                  {studentsCount > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border-custom/50 bg-bg-secondary/70 text-text-secondary text-[11px] uppercase font-semibold">
                            <th className="py-2.5 px-5">Alumno</th>
                            <th className="py-2.5 px-5">Correo institucional</th>
                            <th className="py-2.5 px-5 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom/30">
                          {selectedCommunity.students.map((st: any, idx: number) => {
                            const name = typeof st === 'object' ? st.fullname : 'Alumno Inscrito';
                            const email = typeof st === 'object' ? st.email : st;
                            return (
                              <tr key={st._id || idx} className="hover:bg-bg-secondary/50 transition-colors">
                                <td className="py-3 px-5 font-medium text-text-primary">
                                  {name}
                                </td>
                                <td className="py-3 px-5 font-mono text-text-secondary">
                                  {email}
                                </td>
                                <td className="py-3 px-5 text-right">
                                  <span className="badge-success">
                                    Activo
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Estado vacío institucional */
                    <div className="py-12 px-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-bg-secondary text-text-secondary flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6 text-text-secondary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">
                          Aún no se han unido alumnos
                        </h4>
                        <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                          Comparte el código de invitación con tus estudiantes para que puedan unirse a esta comunidad.
                        </p>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => copyCode(selectedCommunity.code)}
                          className="px-3.5 py-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom text-text-primary border border-border-custom text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-text-secondary" />
                          Copiar código
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center bg-white dark:bg-panel rounded-xl border border-border-custom p-8 space-y-3">
                <Users className="w-10 h-10 text-text-secondary mx-auto" />
                <h3 className="text-base font-semibold text-text-primary">
                  No hay comunidades creadas
                </h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Crea una nueva comunidad docente para comenzar a organizar a tus alumnos y materiales.
                </p>
                <button
                  onClick={() => setShowNewCommModal(true)}
                  className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  + Crear Comunidad
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PESTAÑA 2: PRESENTACIONES Y MATERIALES
            ========================================================================= */}
        {activeTab === 'materials' && (
          <div className="space-y-6 max-w-5xl ios-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 border-b border-border-custom pb-2 w-full sm:w-auto">
                <button
                  onClick={() => setMaterialsFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    materialsFilter === 'all'
                      ? 'bg-border-custom/80 text-text-primary dark:bg-panel dark:text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Todos ({materialsCount})
                </button>
                <button
                  onClick={() => setMaterialsFilter('published')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    materialsFilter === 'published'
                      ? 'bg-border-custom/80 text-text-primary dark:bg-panel dark:text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Publicados ({materialsCount})
                </button>
                <button
                  onClick={() => setMaterialsFilter('draft')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    materialsFilter === 'draft'
                      ? 'bg-border-custom/80 text-text-primary dark:bg-panel dark:text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Borradores (0)
                </button>
              </div>

              <button
                onClick={() => setShowNewMatModal(true)}
                className="px-3.5 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo material
              </button>
            </div>

            {filteredMaterials.length > 0 ? (
              <div className="bg-white dark:bg-panel rounded-xl border border-border-custom shadow-xs divide-y divide-border-custom/40">
                {filteredMaterials.map((mat, i) => (
                  <div
                    key={mat._id || i}
                    className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg-secondary/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                          {mat.title}
                        </h4>
                        <span className="badge-success">
                          Publicado
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary flex items-center gap-2">
                        <span>{mat.category === 'presentacion' ? 'Presentación de diapositivas' : mat.category}</span>
                        {mat.fileName && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{mat.fileName}</span>
                            {mat.fileSize && <span>({mat.fileSize})</span>}
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(mat.fileUrl || mat.fileData) && (
                        <a
                          href={mat.fileUrl || mat.fileData}
                          download={mat.fileName || 'material'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom text-text-primary text-xs font-medium flex items-center gap-1 transition-colors border border-border-custom"
                        >
                          <Download className="w-3.5 h-3.5 text-text-secondary" />
                          Descargar
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedMatId(mat._id || mat.id || '');
                          setExamTitle(`Evaluación: ${mat.title}`);
                          setShowCreateExamModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-tech-purple/10 hover:bg-tech-purple/20 text-tech-purple text-xs font-semibold transition-colors cursor-pointer border border-tech-purple/20"
                      >
                        Generar evaluación
                      </button>
                      <button
                        onClick={() => setViewingMaterial(mat)}
                        className="px-2.5 py-1.5 rounded-lg border border-border-custom hover:bg-bg-secondary text-text-secondary hover:text-text-primary text-xs font-medium cursor-pointer"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(mat._id || mat.id || '')}
                        className="p-1.5 text-text-secondary hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        title="Eliminar material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-white dark:bg-panel rounded-xl border border-border-custom p-8 space-y-2">
                <Presentation className="w-8 h-8 text-text-secondary mx-auto" />
                <h4 className="text-sm font-semibold text-text-primary">
                  No hay presentaciones o materiales
                </h4>
                <p className="text-xs text-text-secondary">
                  Sube diapositivas o apuntes de clase para tus estudiantes.
                </p>
                <button
                  onClick={() => setShowNewMatModal(true)}
                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  + Subir material
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PESTAÑA 3: EVALUACIONES
            ========================================================================= */}
        {activeTab === 'exams' && (
          <div className="space-y-6 max-w-5xl ios-tab-panel">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom">
              <h3 className="text-base font-bold text-text-primary">
                Evaluaciones
              </h3>

              <button
                onClick={() => setShowCreateExamModal(true)}
                className="px-3.5 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Crear evaluación
              </button>
            </div>

            {selectedCommunity?.exams?.length ? (
              <div className="rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-custom bg-bg-secondary/70 text-text-secondary text-[11px] uppercase font-semibold">
                      <th className="py-3 px-5">Nombre</th>
                      <th className="py-3 px-5">Preguntas</th>
                      <th className="py-3 px-5">Fecha</th>
                      <th className="py-3 px-5">Estado</th>
                      <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/30">
                    {selectedCommunity.exams.map(exam => {
                      const eid = exam._id || exam.id || '';
                      const isActive = exam.status === 'activo';

                      return (
                        <tr key={eid} className="hover:bg-bg-secondary/50 transition-colors">
                          <td className="py-3 px-5">
                            <div className="font-semibold text-text-primary">
                              {exam.title}
                            </div>
                            <div className="text-[11px] text-text-secondary">
                              Basado en: {exam.basedOnMaterialTitle || 'Clase'}
                            </div>
                          </td>
                          <td className="py-3 px-5 text-text-primary font-mono font-medium">
                            {exam.questions?.length || 0}
                          </td>
                          <td className="py-3 px-5 text-text-secondary font-mono">
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-5">
                            <span
                              className={`inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${
                                isActive
                                  ? 'badge-success'
                                  : exam.status === 'finalizado'
                                  ? 'bg-bg-secondary text-text-secondary border border-border-custom'
                                  : 'badge-amber'
                              }`}
                            >
                              {exam.status}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isActive ? (
                                <button
                                  onClick={() => handleSetExamStatus(eid, 'finalizado')}
                                  className="px-2.5 py-1 rounded bg-bg-secondary hover:bg-border-custom text-text-primary text-xs font-medium cursor-pointer border border-border-custom"
                                >
                                  Finalizar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSetExamStatus(eid, 'activo')}
                                  className="px-2.5 py-1 rounded bg-tech-purple/10 hover:bg-tech-purple/20 text-tech-purple text-xs font-semibold cursor-pointer border border-tech-purple/20"
                                >
                                  Publicar
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingExam(exam);
                                  setEditExamTitle(exam.title);
                                  setEditExamDesc(exam.description || '');
                                  setEditExamDuration(exam.durationMinutes || 20);
                                  setEditExamLock(exam.lockNotesDuringExam !== false);
                                }}
                                className="p-1.5 text-text-secondary hover:text-text-primary rounded cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDuplicateExam(eid)}
                                className="p-1.5 text-text-secondary hover:text-text-primary rounded cursor-pointer"
                                title="Duplicar"
                              >
                                <DuplicateIcon className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteExam(eid)}
                                className="p-1.5 text-text-secondary hover:text-red-600 rounded cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-white dark:bg-panel rounded-xl border border-border-custom p-8 space-y-2">
                <ShieldCheck className="w-8 h-8 text-text-secondary mx-auto" />
                <h4 className="text-sm font-semibold text-text-primary">
                  Aún no hay evaluaciones creadas
                </h4>
                <p className="text-xs text-text-secondary">
                  Crea cuestionarios basados en las presentaciones de clase.
                </p>
                <button
                  onClick={() => setShowCreateExamModal(true)}
                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  + Crear evaluación
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PESTAÑA 4: MODO EXAMEN
            ========================================================================= */}
        {activeTab === 'control' && (
          <div className="space-y-6 max-w-5xl ios-tab-panel">
            <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-tech-purple shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Supervisión y control de evaluaciones
                </h4>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Al iniciar un examen en modo activo con bloqueo de notas, los alumnos correspondientes tendrán temporalmente deshabilitada la consulta de sus notas para evaluar su razonamiento individual.
                </p>
              </div>
            </div>

            {selectedCommunity?.exams?.length ? (
              <div className="bg-white dark:bg-panel rounded-xl border border-border-custom shadow-xs divide-y divide-border-custom/40">
                {selectedCommunity.exams.map(exam => {
                  const eid = exam._id || exam.id || '';
                  const isActive = exam.status === 'activo';
                  const isPaused = exam.status === 'pausado';

                  return (
                    <div
                      key={eid}
                      className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                              isActive
                                ? 'badge-success'
                                : isPaused
                                ? 'badge-blue'
                                : 'bg-bg-secondary text-text-secondary border border-border-custom'
                            }`}
                          >
                            {exam.status}
                          </span>
                          <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-text-secondary" />
                            {exam.durationMinutes || 20} min
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-text-primary">
                          {exam.title}
                        </h4>
                        <p className="text-xs text-text-secondary">
                          {exam.questions?.length || 0} preguntas · {exam.basedOnMaterialTitle || 'Clase'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && (
                          <button
                            onClick={() => handleSetExamStatus(eid, 'pausado')}
                            className="px-3 py-1.5 rounded-lg border border-border-custom hover:bg-bg-secondary text-text-primary text-xs font-medium cursor-pointer"
                          >
                            Pausar
                          </button>
                        )}
                        {isPaused && (
                          <button
                            onClick={() => handleSetExamStatus(eid, 'activo')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer shadow-xs"
                          >
                            Reanudar
                          </button>
                        )}
                        {!isActive && !isPaused && (
                          <button
                            onClick={() => handleSetExamStatus(eid, 'activo')}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                          >
                            Iniciar examen
                          </button>
                        )}
                        {(isActive || isPaused) && (
                          <button
                            onClick={() => handleSetExamStatus(eid, 'finalizado')}
                            className="px-3 py-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom text-text-primary text-xs font-medium cursor-pointer border border-border-custom"
                          >
                            Finalizar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center bg-white dark:bg-panel rounded-xl border border-border-custom p-8 text-xs text-text-secondary">
                No hay evaluaciones registradas en esta comunidad.
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PESTAÑA 5: ENTREGAS
            ========================================================================= */}
        {activeTab === 'submissions' && (
          <div className="space-y-6 max-w-5xl ios-tab-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-custom">
              <h3 className="text-base font-bold text-text-primary">
                Buzón de entregas
              </h3>

              <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-lg text-xs border border-border-custom">
                <button
                  onClick={() => setSubmissionsFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    submissionsFilter === 'all'
                      ? 'bg-white dark:bg-panel text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Todas ({submissionsCount})
                </button>
                <button
                  onClick={() => setSubmissionsFilter('pending')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    submissionsFilter === 'pending'
                      ? 'bg-white dark:bg-panel text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setSubmissionsFilter('reviewed')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    submissionsFilter === 'reviewed'
                      ? 'bg-white dark:bg-panel text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Revisadas
                </button>
              </div>
            </div>

            {filteredSubmissions.length > 0 ? (
              <div className="rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-custom bg-bg-secondary/70 text-text-secondary text-[11px] uppercase font-semibold">
                      <th className="py-3 px-5">Alumno</th>
                      <th className="py-3 px-5">Actividad</th>
                      <th className="py-3 px-5">Fecha</th>
                      <th className="py-3 px-5">Calificación</th>
                      <th className="py-3 px-5">Estado</th>
                      <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/30">
                    {filteredSubmissions.map((sub, sIdx) => {
                      const isReviewed = typeof sub.score === 'number';

                      return (
                        <tr key={sub._id || sIdx} className="hover:bg-bg-secondary/50 transition-colors">
                          <td className="py-3 px-5 font-medium text-text-primary">
                            <div>{sub.studentName}</div>
                            <div className="text-[11px] text-text-secondary font-mono">{sub.studentEmail}</div>
                          </td>
                          <td className="py-3 px-5 text-text-primary">
                            {sub.title}
                          </td>
                          <td className="py-3 px-5 text-text-secondary font-mono">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-5 font-mono font-bold text-text-primary">
                            {isReviewed ? `${sub.score} pts` : '—'}
                          </td>
                          <td className="py-3 px-5">
                            <span
                              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                isReviewed
                                  ? 'badge-success'
                                  : 'badge-amber'
                              }`}
                            >
                              {isReviewed ? 'Revisada' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {sub.type === 'nota_pdf' && (
                                <button
                                  onClick={() => handleViewStudentPdf(sub)}
                                  className="px-2.5 py-1 rounded bg-bg-secondary hover:bg-border-custom text-text-primary text-xs font-medium cursor-pointer border border-border-custom"
                                >
                                  Ver PDF
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setReviewingSub(sub);
                                  setReviewGrade(typeof sub.score === 'number' ? sub.score : '');
                                }}
                                className="px-2.5 py-1 rounded bg-tech-purple/10 hover:bg-tech-purple/20 text-tech-purple text-xs font-semibold cursor-pointer border border-tech-purple/20"
                              >
                                {isReviewed ? 'Editar nota' : 'Calificar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center bg-white dark:bg-panel rounded-xl border border-border-custom p-8 text-xs text-text-secondary">
                No hay entregas en esta sección.
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALES (ESTILO INSTITUCIONAL SOBRIO, FONDO BLANCO, BORDES GRISES)
          ========================================================================= */}

      {/* Modal: Nueva Comunidad */}
      {showNewCommModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-base font-bold text-text-primary">
                Nueva Comunidad Privada
              </h3>
              <button
                onClick={() => setShowNewCommModal(false)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Crea un espacio de clase para compartir presentaciones y evaluaciones con tus alumnos.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Nombre de la Materia / Clase:
                </label>
                <input
                  type="text"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  placeholder="Ej. Física Cuántica I - Grupo B"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Descripción (Opcional):
                </label>
                <textarea
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  placeholder="Objetivos o notas del curso..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewCommModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCommunity}
                className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Crear Comunidad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Administrar Comunidad */}
      {showEditCommModal && selectedCommunity && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-base font-bold text-text-primary">
                Administrar Comunidad
              </h3>
              <button
                onClick={() => setShowEditCommModal(false)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Nombre de la Comunidad:
                </label>
                <input
                  type="text"
                  value={editCommName}
                  onChange={(e) => setEditCommName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Descripción:
                </label>
                <textarea
                  value={editCommDesc}
                  onChange={(e) => setEditCommDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary"
                />
              </div>

              <div className="p-3 rounded-lg bg-bg-secondary border border-border-custom flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-secondary block">Código de invitación</span>
                  <span className="text-sm font-mono font-bold text-text-primary">{selectedCommunity.code}</span>
                </div>
                <button
                  onClick={() => copyCode(selectedCommunity.code)}
                  className="p-1.5 rounded bg-white dark:bg-panel hover:bg-bg-secondary border border-border-custom text-xs text-text-primary cursor-pointer shadow-xs"
                  title="Copiar código"
                >
                  <Copy className="w-3.5 h-3.5 text-text-secondary" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEditCommModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Material */}
      {showNewMatModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-base font-bold text-text-primary">
                Subir presentación o material
              </h3>
              <button
                onClick={() => setShowNewMatModal(false)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Archivo (PowerPoint, PDF o Guía):
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx,.ppt,.pdf,.odp,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!uploadedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                      isDraggingFile
                        ? 'border-tech-purple bg-tech-purple/5'
                        : 'border-border-custom hover:border-tech-purple/40 bg-bg-secondary/50'
                    }`}
                  >
                    <Upload className="w-6 h-6 text-text-secondary mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-text-primary">
                      Haz clic o arrastra tu archivo aquí
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      PowerPoint (.pptx), PDF (.pdf), OpenDocument (.odp) o texto (.txt, .md)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary border border-border-custom">
                    <div className="flex items-center gap-2 truncate">
                      <Presentation className="w-4 h-4 text-tech-purple shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-text-primary truncate">{uploadedFile.name}</div>
                        <div className="text-[10px] text-text-secondary font-mono">{uploadedFile.size}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 rounded text-text-secondary hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Título:
                </label>
                <input
                  type="text"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Ej. Leyes de Newton y Dinámica"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Categoría:
                </label>
                <select
                  value={matCategory}
                  onChange={(e) => setMatCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                >
                  <option value="presentacion">Presentación de Diapositivas</option>
                  <option value="material">Material de Lectura / Guía</option>
                  <option value="apuntes">Apuntes del Profesor</option>
                  <option value="actividad">Actividad / Tarea</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Contenido o puntos explicados en clase:
                </label>
                <textarea
                  value={matContent}
                  onChange={(e) => setMatContent(e.target.value)}
                  placeholder="Resumen de puntos revisados en clase..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary font-mono focus:outline-none focus:border-tech-purple"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewMatModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddMaterial}
                className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Publicar material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Evaluación */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-base font-bold text-text-primary">
                Crear Evaluación
              </h3>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Material de referencia:
                </label>
                <select
                  value={selectedMatId}
                  onChange={(e) => {
                    setSelectedMatId(e.target.value);
                    const mat = selectedCommunity?.materials?.find(m => (m._id || m.id) === e.target.value);
                    if (mat && !examTitle) {
                      setExamTitle(`Evaluación: ${mat.title}`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                >
                  <option value="">-- Elige un material de clase --</option>
                  {selectedCommunity?.materials?.map(m => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Número de preguntas:
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                >
                  <option value={3}>3 Preguntas</option>
                  <option value={5}>5 Preguntas</option>
                  <option value={8}>8 Preguntas</option>
                </select>
              </div>

              <button
                onClick={handleGenerateExamAI}
                disabled={isGenerating || !selectedMatId}
                className="w-full py-2 rounded-lg bg-tech-purple/10 hover:bg-tech-purple/20 text-tech-purple font-semibold text-xs border border-tech-purple/20 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isGenerating ? 'Generando preguntas...' : 'Generar preguntas basadas en el material'}
              </button>

              {generatedQuestions.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border-custom/50">
                  <div>
                    <label className="text-xs font-semibold text-text-primary block mb-1">Título del examen:</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-primary block mb-1">Instrucciones:</label>
                    <input
                      type="text"
                      value={examDesc}
                      onChange={(e) => setExamDesc(e.target.value)}
                      placeholder="Duración, indicaciones..."
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-secondary flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lockNotesOnExam}
                        onChange={(e) => setLockNotesOnExam(e.target.checked)}
                        className="rounded border-border-custom text-tech-purple focus:ring-tech-purple"
                      />
                      <span>Bloquear notas de estudio durante la prueba</span>
                    </label>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-bg-secondary border border-border-custom text-xs space-y-1.5">
                        <div className="font-semibold text-text-primary">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-1.5 px-2 rounded text-[11px] ${
                                oIdx === q.answer
                                  ? 'badge-success font-semibold'
                                  : 'bg-white dark:bg-panel text-text-secondary border border-border-custom'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowCreateExamModal(false)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveExam}
                      className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Guardar evaluación
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Evaluación */}
      {editingExam && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-base font-bold text-text-primary">
                Editar Evaluación
              </h3>
              <button
                onClick={() => setEditingExam(null)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Título:</label>
                <input
                  type="text"
                  value={editExamTitle}
                  onChange={(e) => setEditExamTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Descripción:</label>
                <input
                  type="text"
                  value={editExamDesc}
                  onChange={(e) => setEditExamDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Duración (minutos):</label>
                <input
                  type="number"
                  value={editExamDuration}
                  onChange={(e) => setEditExamDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary font-mono focus:outline-none focus:border-tech-purple"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs text-text-secondary flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editExamLock}
                    onChange={(e) => setEditExamLock(e.target.checked)}
                    className="rounded border-border-custom text-tech-purple focus:ring-tech-purple"
                  />
                  <span>Bloquear notas de estudiantes durante la prueba</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingExam(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditExam}
                className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Material */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-sm font-bold text-text-primary truncate">
                {viewingMaterial.title}
              </h3>
              <button
                onClick={() => setViewingMaterial(null)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewingMaterial.fileName && (
              <div className="p-3 rounded-lg bg-bg-secondary border border-border-custom flex items-center justify-between text-xs">
                <span className="font-mono text-text-primary truncate">{viewingMaterial.fileName}</span>
                {(viewingMaterial.fileUrl || viewingMaterial.fileData) && (
                  <a
                    href={viewingMaterial.fileUrl || viewingMaterial.fileData}
                    download={viewingMaterial.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-tech-purple hover:bg-tech-purple-hover text-white font-medium text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </a>
                )}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-semibold text-text-primary block">Contenido del material:</span>
              <div className="p-3 rounded-lg bg-bg-secondary border border-border-custom font-mono text-xs text-text-secondary whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                {viewingMaterial.content}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setViewingMaterial(null)}
                className="px-4 py-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom text-text-primary text-xs font-medium cursor-pointer border border-border-custom"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Calificar Entrega */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-panel border border-border-custom shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-custom/50">
              <h3 className="text-base font-bold text-text-primary">
                Calificar entrega
              </h3>
              <button
                onClick={() => setReviewingSub(null)}
                className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-secondary block">Alumno:</span>
                <span className="font-semibold text-text-primary">{reviewingSub.studentName} ({reviewingSub.studentEmail})</span>
              </div>

              <div>
                <span className="text-text-secondary block">Actividad:</span>
                <span className="font-medium text-text-primary">{reviewingSub.title}</span>
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Calificación (0 a 100 puntos):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reviewGrade}
                  onChange={(e) => setReviewGrade(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej. 95"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-bg-primary border border-border-custom text-xs text-text-primary font-mono focus:outline-none focus:border-tech-purple"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReviewingSub(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (reviewingSub && typeof reviewGrade === 'number') {
                    reviewingSub.score = reviewGrade;
                    showToast(`Calificación guardada: ${reviewGrade} pts`);
                    setReviewingSub(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Guardar calificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Sobrio */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-text-primary text-white shadow-xl text-xs font-medium flex items-center gap-2.5 border border-border-custom/20">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
