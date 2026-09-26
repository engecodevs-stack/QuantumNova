import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Save,
  Trash2,
  FileText,
  BookOpen,
  Edit3,
  Eye,
  Hash,
  Info,
  Folder as FolderIcon,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  BrainCircuit,
  Upload,
  Download,
  Image as ImageIcon,
  MoreVertical,
  Send,
  ShieldAlert,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Heading2,
  List as ListIcon
} from 'lucide-react';
import type { Note, User, Community } from '../types';
import { MindMapView } from './MindMapView';
import { ContextualHelpBadge } from './ContextualHelpBadge';

interface Folder {
  id: string;
  name: string;
  parent?: string;
}

interface NotesViewProps {
  notes: Note[];
  activeNote: Note | null;
  setActiveNote: (note: Note | null) => void;
  onCreateNote: (title?: string, folderId?: string) => Promise<Note>;
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onDeleteNotesBulk: (ids: string[]) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefreshNotes: () => Promise<void>;
  readingMode: boolean;
  setReadingMode: (mode: boolean) => void;
  theme: 'dark' | 'light';
  isMobileOrTablet?: boolean;
  currentUser?: User | null;
  isExamLocked?: boolean;
  examLockInfo?: { communityName: string; examTitle: string } | null;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  activeNote,
  setActiveNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onDeleteNotesBulk,
  searchQuery,
  setSearchQuery,
  onRefreshNotes,
  readingMode,
  setReadingMode,
  theme,
  isMobileOrTablet = false,
  currentUser,
  isExamLocked = false,
  examLockInfo
}) => {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>(
    window.innerWidth < 768 ? 'edit' : 'split'
  );
  const [showMap, setShowMap] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Bulk action states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  // Folders and UI states
  const [folders, setFolders] = useState<Folder[]>([]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [isSidebarListCollapsed, setIsSidebarListCollapsed] = useState(false);
  const [securityToast, setSecurityToast] = useState<{ show: boolean; message: string } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Custom features (Import, Export, Images & Lightbox) states & refs
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string>('');

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);

  // Active formats state for WYSIWYG toolbar button indicators
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    list: false,
    mark: null as string | null
  });

  // Convert legacy markdown / raw symbols into clean visual HTML
  const convertRawToVisualHtml = (raw: string): string => {
    if (!raw) return '';
    let html = raw;

    // Headings at line beginnings: #, ##, ###
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // ==highlight==
    html = html.replace(/==(.*?)==/g, '<mark class="orange">$1</mark>');

    // Lists
    html = html.replace(/^[\*\-] (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>[\s\S]*?<\/li>)+/gi, (match) => `<ul>${match}</ul>`);

    // Paragraph wrapping if plain text without HTML block tags
    if (
      !html.includes('<p>') &&
      !html.includes('<div>') &&
      !html.includes('<h1>') &&
      !html.includes('<h2>') &&
      !html.includes('<h3>') &&
      !html.includes('<ul>')
    ) {
      const blocks = html.split(/\n\n+/);
      html = blocks
        .map(b => {
          const trimmed = b.trim();
          if (!trimmed) return '';
          if (
            trimmed.startsWith('<h') ||
            trimmed.startsWith('<ul') ||
            trimmed.startsWith('<blockquote>') ||
            trimmed.startsWith('<div')
          ) {
            return trimmed;
          }
          return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        })
        .filter(Boolean)
        .join('');
    }

    return html;
  };

  // Inspect selection to update active toolbar button states
  const checkActiveFormats = () => {
    try {
      const isBold = typeof document !== 'undefined' && document.queryCommandState ? document.queryCommandState('bold') : false;
      const isItalic = typeof document !== 'undefined' && document.queryCommandState ? document.queryCommandState('italic') : false;
      const isUnderline = typeof document !== 'undefined' && document.queryCommandState ? document.queryCommandState('underline') : false;

      let currentMark: string | null = null;
      let isHeading = false;
      let isList = false;

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === 'mark') {
              if (el.className.includes('orange')) currentMark = 'orange';
              else if (el.className.includes('purple')) currentMark = 'purple';
              else if (el.className.includes('blue')) currentMark = 'blue';
              else if (el.className.includes('amber')) currentMark = 'amber';
            }
            if (tag === 'h1' || tag === 'h2' || tag === 'h3') isHeading = true;
            if (tag === 'ul' || tag === 'ol' || tag === 'li') isList = true;
          }
          node = node.parentNode;
        }
      }

      setActiveFormats({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        heading: isHeading,
        list: isList,
        mark: currentMark
      });
    } catch {
      // ignore
    }
  };

  // Handle WYSIWYG typing & content update
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    isTypingRef.current = true;

    // Clean any truly empty marks without text or child elements
    editorRef.current.querySelectorAll('mark').forEach(m => {
      if (!m.textContent && !m.querySelector('br, img')) {
        m.remove();
      }
    });

    const currentHtml = editorRef.current.innerHTML;
    setEditContent(currentHtml);
    checkActiveFormats();

    if (activeNote) {
      onUpdateNote({
        ...activeNote,
        title: editTitle,
        content: currentHtml,
        tags: editTags,
        updated_at: new Date().toISOString()
      });
    }

    setTimeout(() => {
      isTypingRef.current = false;
    }, 80);
  };

  // Execute standard visual format command
  const executeCommand = (cmd: string, val: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    handleEditorInput();
  };

  // Apply visual highlight directly on selected text (WYSIWYG)
  const applyHighlight = (colorClass: 'orange' | 'purple' | 'blue' | 'amber') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // 1. When NO text is selected (range.collapsed):
    if (range.collapsed) {
      // Check if cursor is currently inside a mark
      let parentMark: HTMLElement | null = null;
      let node: Node | null = range.commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'mark') {
          parentMark = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      if (parentMark) {
        if (parentMark.className.includes(colorClass)) {
          // Toggle off: break out of the mark so subsequent typing is normal unhighlighted text
          const zws = document.createTextNode('\u200B');
          if (parentMark.nextSibling) {
            parentMark.parentNode?.insertBefore(zws, parentMark.nextSibling);
          } else {
            parentMark.parentNode?.appendChild(zws);
          }
          const newRange = document.createRange();
          newRange.setStart(zws, 1);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          checkActiveFormats();
          handleEditorInput();
          return;
        } else {
          // Switch current highlight color
          parentMark.className = colorClass;
          checkActiveFormats();
          handleEditorInput();
          return;
        }
      }

      // Cursor is in plain text: prepare typing inside this highlight color WITHOUT any placeholder dummy text!
      const mark = document.createElement('mark');
      mark.className = colorClass;
      const zws = document.createTextNode('\u200B');
      mark.appendChild(zws);
      range.insertNode(mark);

      const newRange = document.createRange();
      newRange.setStart(zws, 1);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      checkActiveFormats();
      handleEditorInput();
      return;
    }

    // 2. When text IS selected (!range.collapsed):
    // Check if selection is entirely within an existing mark
    let parentMark: HTMLElement | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'mark') {
        parentMark = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (parentMark) {
      const isSameColor = parentMark.className.includes(colorClass);

      // Split parentMark into [before, selected, after]
      const beforeRange = document.createRange();
      beforeRange.setStart(parentMark, 0);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const beforeFrag = beforeRange.cloneContents();

      const afterRange = document.createRange();
      afterRange.setStart(range.endContainer, range.endOffset);
      afterRange.setEnd(parentMark, parentMark.childNodes.length);
      const afterFrag = afterRange.cloneContents();

      const selectedFrag = range.cloneContents();
      const container = parentMark.parentNode;
      if (!container) return;

      const replacementFragment = document.createDocumentFragment();

      // Before part (retains parent mark styling if non-empty)
      if (beforeFrag.textContent && beforeFrag.textContent.length > 0) {
        const beforeMark = document.createElement('mark');
        beforeMark.className = parentMark.className;
        beforeMark.appendChild(beforeFrag);
        replacementFragment.appendChild(beforeMark);
      }

      // Middle selected part
      let middleNode: Node;
      if (isSameColor) {
        // Toggled off: unwrapped plain text
        middleNode = selectedFrag;
        replacementFragment.appendChild(middleNode);
      } else {
        // Changed to new color
        const newMark = document.createElement('mark');
        newMark.className = colorClass;
        newMark.appendChild(selectedFrag);
        middleNode = newMark;
        replacementFragment.appendChild(middleNode);
      }

      // After part (retains parent mark styling if non-empty)
      if (afterFrag.textContent && afterFrag.textContent.length > 0) {
        const afterMark = document.createElement('mark');
        afterMark.className = parentMark.className;
        afterMark.appendChild(afterFrag);
        replacementFragment.appendChild(afterMark);
      }

      container.replaceChild(replacementFragment, parentMark);

      // Restore selection to the modified middle portion
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(middleNode);
      selection.addRange(newRange);
      checkActiveFormats();
      handleEditorInput();
      return;
    }

    // General case: selection across multiple elements or clean plain text
    try {
      const extracted = range.extractContents();

      // Unwrap any existing marks inside the extracted content to avoid nested marks
      const innerMarks = extracted.querySelectorAll('mark');
      innerMarks.forEach(m => {
        const p = m.parentNode;
        while (m.firstChild) p?.insertBefore(m.firstChild, m);
        p?.removeChild(m);
      });

      const mark = document.createElement('mark');
      mark.className = colorClass;
      mark.appendChild(extracted);
      range.insertNode(mark);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(mark);
      selection.addRange(newRange);

      // Remove any empty lingering marks in editor
      if (editorRef.current) {
        editorRef.current.querySelectorAll('mark').forEach(m => {
          if (!m.textContent || m.textContent === '') {
            m.remove();
          }
        });
      }

      checkActiveFormats();
      handleEditorInput();
    } catch (err) {
      console.error('Error applying highlight:', err);
    }
  };

  // Student PDF submission state (PDF only)
  const [showSendPdfModal, setShowSendPdfModal] = useState(false);
  const [studentCommunities, setStudentCommunities] = useState<Community[]>([]);
  const [selectedTargetCommId, setSelectedTargetCommId] = useState<string>('');
  const [isSubmittingPdf, setIsSubmittingPdf] = useState(false);

  const handleToggleSelectAll = () => {
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map(n => n.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.length === 0) return;
    if (!confirm(`¿Estás seguro de que deseas eliminar las ${selectedNoteIds.length} notas seleccionadas?`)) return;
    try {
      await onDeleteNotesBulk(selectedNoteIds);
      setSelectedNoteIds([]);
      setIsBulkMode(false);
    } catch (err) {
      console.error('Error deleting notes in bulk:', err);
    }
  };

  // Fetch folders from MongoDB backend
  const fetchFolders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Load note values into local edit state when active note changes
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title || '');
      const visualHtml = convertRawToVisualHtml(activeNote.content || '');
      setEditContent(visualHtml);
      if (editorRef.current && !isTypingRef.current) {
        editorRef.current.innerHTML = visualHtml;
      }
      setEditTags(activeNote.tags || []);
      setTagInput('');
      setTimeout(checkActiveFormats, 40);
    } else {
      setEditTitle('');
      setEditContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setEditTags([]);
      setTagInput('');
    }
  }, [activeNote?.id]);

  // Folder management actions
  const handleCreateFolder = async () => {
    const folderName = prompt('Nombre de la nueva carpeta:');
    if (!folderName || !folderName.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName.trim() })
      });
      if (res.ok) {
        await fetchFolders();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar esta carpeta? Las notas dentro de ella quedarán sin carpeta.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/folders/${folderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchFolders();
        await onRefreshNotes();
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  const handleMoveNoteToFolder = async (noteId: string, folderId: string | null) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;
    try {
      await onUpdateNote({
        ...noteToUpdate,
        folderId: folderId
      });
      await onRefreshNotes();
    } catch (err) {
      console.error('Error moving note to folder:', err);
    }
  };

  // Security restrictions toast
  const triggerSecurityToast = (message: string) => {
    setSecurityToast({ show: true, message });
    setTimeout(() => {
      setSecurityToast(null);
    }, 4500);
  };

  const preventCopyPaste = (e: React.ClipboardEvent) => {
    // Los docentes sí pueden hacer copypaste en sus notas y materiales
    if (currentUser?.role === 'profe') {
      return;
    }
    e.preventDefault();
    triggerSecurityToast('La escritura activa favorece el aprendizaje y la retención del conocimiento. ¡Intenta resumir o escribir con tus propias palabras!');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      applyHighlight('orange');
      return;
    }
    if (isCtrlOrCmd && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      executeCommand('bold');
      return;
    }
    if (isCtrlOrCmd && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      executeCommand('italic');
      return;
    }
    if (isCtrlOrCmd && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      executeCommand('underline');
      return;
    }

    // Break out of mark on Enter key so next line starts clean in plain text
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let markNode: HTMLElement | null = null;
        let n: Node | null = range.commonAncestorContainer;
        while (n && n !== editorRef.current) {
          if (n.nodeType === Node.ELEMENT_NODE && (n as HTMLElement).tagName.toLowerCase() === 'mark') {
            markNode = n as HTMLElement;
            break;
          }
          n = n.parentNode;
        }

        if (markNode) {
          const endRange = document.createRange();
          endRange.selectNodeContents(markNode);
          endRange.setStart(range.endContainer, range.endOffset);
          const isAtEnd = endRange.toString().length === 0;

          if (isAtEnd) {
            e.preventDefault();
            const div = document.createElement('div');
            div.innerHTML = '<br>';
            if (markNode.nextSibling) {
              markNode.parentNode?.insertBefore(div, markNode.nextSibling);
            } else {
              markNode.parentNode?.appendChild(div);
            }
            const newRange = document.createRange();
            newRange.setStart(div, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            handleEditorInput();
            return;
          }
        }
      }
    }

    // Los docentes sí pueden usar atajos de teclado para copiar y pegar
    if (currentUser?.role === 'profe') {
      return;
    }
    if (isCtrlOrCmd && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      triggerSecurityToast('La escritura activa favorece el aprendizaje y la retención del conocimiento. ¡Escribe de forma manual para recordar mejor!');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Los docentes tienen menú contextual libre
    if (currentUser?.role === 'profe') {
      return;
    }
    e.preventDefault();
    triggerSecurityToast('El menú contextual está deshabilitado en el editor para alumnos. Practica la escritura activa para afianzar tus ideas.');
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(n => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = n.title.toLowerCase().includes(query);
    const matchesContent = n.content.toLowerCase().includes(query);
    const matchesTags = n.tags.some(t => t.toLowerCase().includes(query));
    return matchesTitle || matchesContent || matchesTags;
  });

  // Organize notes by folders
  const folderNotesMap = React.useMemo(() => {
    const map: Record<string, Note[]> = {};
    folders.forEach(f => {
      map[f.id] = [];
    });

    const unassigned: Note[] = [];

    filteredNotes.forEach(note => {
      const folderId = note.folder ? note.folder.id : null;
      if (folderId && map[folderId] !== undefined) {
        map[folderId].push(note);
      } else {
        unassigned.push(note);
      }
    });

    return { map, unassigned };
  }, [folders, filteredNotes]);

  // Image Upload with Canvas-based resize compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        const maxDimension = 800;
        let width = imgElement.width;
        let height = imgElement.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(imgElement, 0, 0, width, height);

        const base64Url = canvas.toDataURL('image/jpeg', 0.85);

        const newImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: base64Url,
          x: 10,
          y: 10,
          width: Math.min(250, width),
          height: Math.min(180, height),
          caption: ''
        };

        const updatedImages = [...(activeNote.images || []), newImage];
        const updatedNote = {
          ...activeNote,
          images: updatedImages,
          updated_at: new Date().toISOString()
        };

        // Update local and parent state
        setActiveNote(updatedNote);
        onUpdateNote(updatedNote);
      };
      imgElement.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Dragging logic for image position (absolute in container percentage)
  const handleImageMouseDown = (imgId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.cursor-se-resize')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const container = previewContainerRef.current;
    if (!container || !activeNote) return;

    const containerRect = container.getBoundingClientRect();
    const images = activeNote.images || [];
    const imgIndex = images.findIndex(img => img.id === imgId);
    if (imgIndex === -1) return;

    const img = images[imgIndex];
    const startX = img.x;
    const startY = img.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    let distanceMoved = 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      distanceMoved += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Convert pixel delta to percentage
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;

      const newX = Math.max(0, Math.min(95, startX + deltaXPercent));
      const newY = Math.max(0, Math.min(95, startY + deltaYPercent));

      const updatedImages = [...images];
      updatedImages[imgIndex] = {
        ...img,
        x: newX,
        y: newY
      };

      setActiveNote({
        ...activeNote,
        images: updatedImages
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (distanceMoved < 6) {
        setActiveLightbox(img.url);
        setLightboxCaption(img.caption || '');
      } else {
        if (activeNote) {
          onUpdateNote({
            ...activeNote,
            updated_at: new Date().toISOString()
          });
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing logic for images
  const handleResizeMouseDown = (imgId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeNote) return;

    const images = activeNote.images || [];
    const imgIndex = images.findIndex(img => img.id === imgId);
    if (imgIndex === -1) return;

    const img = images[imgIndex];
    const startWidth = img.width || 200;
    const startHeight = img.height || 150;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;

      const newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
      const newHeight = Math.max(80, Math.min(600, startHeight + deltaY));

      const updatedImages = [...images];
      updatedImages[imgIndex] = {
        ...img,
        width: newWidth,
        height: newHeight
      };

      setActiveNote({
        ...activeNote,
        images: updatedImages
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (activeNote) {
        onUpdateNote({
          ...activeNote,
          updated_at: new Date().toISOString()
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Edit image caption/note
  const handleEditImageCaption = (imgId: string) => {
    if (!activeNote) return;
    const images = activeNote.images || [];
    const img = images.find(i => i.id === imgId);
    if (!img) return;

    const newCaption = prompt('Escribe una nota o pie de foto para la imagen:', img.caption || '');
    if (newCaption === null) return;

    const updatedImages = images.map(i => {
      if (i.id === imgId) {
        return { ...i, caption: newCaption.trim() };
      }
      return i;
    });

    const updatedNote = {
      ...activeNote,
      images: updatedImages,
      updated_at: new Date().toISOString()
    };

    setActiveNote(updatedNote);
    onUpdateNote(updatedNote);
  };

  // Delete image
  const handleDeleteImage = (imgId: string) => {
    if (!activeNote) return;
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen de la nota?')) return;

    const images = activeNote.images || [];
    const updatedImages = images.filter(i => i.id !== imgId);

    const updatedNote = {
      ...activeNote,
      images: updatedImages,
      updated_at: new Date().toISOString()
    };

    setActiveNote(updatedNote);
    onUpdateNote(updatedNote);
  };

  // Export to .qnote (exclusive Base64 encoded format)
  const handleExportQNote = () => {
    if (!activeNote) return;

    const exportData = {
      signature: 'QUANTUM_NOVA_NOTE_V1',
      title: activeNote.title,
      content: activeNote.content,
      tags: activeNote.tags || [],
      images: activeNote.images || []
    };

    const jsonStr = JSON.stringify(exportData);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));

    const blob = new Blob([encoded], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (activeNote.title || 'nota').toLowerCase().replace(/[^a-z0-9]/gi, '_');
    link.download = `${sanitizedTitle}.qnote`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simple Markdown to HTML parser helper for Word export
  // Simple Markdown to HTML parser helper for Word and PDF exports
  const markdownToHtml = (md: string) => {
    let html = md;
    
    // Clean raw markup inside marks first if any: <mark class="xxx">**text**</mark>
    html = html.replace(/<mark\s+class="([^"]+)">\*\*(.*?)\*\*<\/mark>/gi, '<mark class="$1">$2</mark>');
    html = html.replace(/<mark>\*\*(.*?)\*\*<\/mark>/gi, '<mark>$1</mark>');

    // Support ==highlight==
    html = html.replace(/==(.*?)==/g, '<mark class="orange">$1</mark>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold / Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Mark tags with inline styles for high-fidelity export rendering
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

    // Paragraphs
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      const trimmed = block.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<block') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote>')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
  };

  // Export to MS Word .doc format (HTML with word headers)
  const handleExportWord = () => {
    if (!activeNote) return;

    const htmlContent = markdownToHtml(activeNote.content || '');
    const tagsHtml = (activeNote.tags || [])
      .map(t => `<span class="tag">${t}</span>`)
      .join(' ');

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${activeNote.title || 'Nota'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #18181F; margin: 1in; }
          h1 { color: #5865F2; font-size: 22pt; margin-bottom: 12pt; border-bottom: 2px solid #E1E1EA; padding-bottom: 6pt; font-weight: bold; }
          h2 { color: #18181F; font-size: 16pt; margin-top: 18pt; margin-bottom: 6pt; font-weight: bold; }
          h3 { color: #5F6070; font-size: 13pt; margin-top: 14pt; margin-bottom: 6pt; font-weight: bold; }
          p, li { font-size: 11pt; color: #334155; margin-bottom: 8pt; }
          ul, ol { margin-top: 0; margin-bottom: 10pt; padding-left: 20px; }
          li { margin-bottom: 4pt; }
          code { font-family: Consolas, monospace; background-color: #F3F2F8; padding: 2px 4px; font-size: 10pt; border: 1px solid #E1E1EA; }
          pre { background-color: #F3F2F8; border-left: 4px solid #5865F2; padding: 10px; font-family: Consolas, monospace; font-size: 10pt; margin-bottom: 10pt; white-space: pre-wrap; }
          blockquote { border-left: 4px solid #A947E8; padding-left: 10px; color: #5F6070; font-style: italic; margin-bottom: 10pt; }
          .tag { background-color: #F3F2F8; color: #5F6070; border: 1px solid #E1E1EA; padding: 2px 6px; border-radius: 4px; font-size: 9pt; margin-right: 4px; display: inline-block; font-family: monospace; }
          .tags-container { margin-bottom: 20pt; }
        </style>
      </head>
      <body>
        <h1>${activeNote.title || 'Sin Título'}</h1>
        <div class="tags-container">${tagsHtml}</div>
        <div class="content">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (activeNote.title || 'nota').toLowerCase().replace(/[^a-z0-9]/gi, '_');
    link.download = `${sanitizedTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export note to clean printable PDF
  const handleExportPDF = () => {
    if (!activeNote) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes para generar el PDF.');
      return;
    }

    const htmlContent = markdownToHtml(activeNote.content || '');
    const tagsHtml = (activeNote.tags || [])
      .map(t => `<span class="tag">${t}</span>`)
      .join(' ');
    const authorName = currentUser?.fullname || 'Estudiante';
    const authorEmail = currentUser?.email || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${activeNote.title || 'Nota'} - QUANTUM NOVA</title>
        <style>
          @page { margin: 15mm; size: A4; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181F; line-height: 1.6; margin: 0; padding: 25px; background: #FFFFFF; }
          .header { border-bottom: 2px solid #5865F2; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 18px; font-weight: 800; color: #5865F2; letter-spacing: 0.5px; }
          .brand span { color: #A947E8; }
          .meta { font-size: 11px; color: #5F6070; text-align: right; }
          h1 { font-size: 24px; font-weight: 700; color: #18181F; margin: 0 0 10px 0; border-bottom: 1px solid #E1E1EA; padding-bottom: 8px; }
          h2 { font-size: 18px; font-weight: 600; color: #18181F; margin: 16px 0 8px 0; }
          h3 { font-size: 15px; font-weight: 600; color: #18181F; margin: 12px 0 6px 0; }
          .tags { margin-bottom: 20px; }
          .tag { display: inline-block; background: #F3F2F8; color: #5F6070; border: 1px solid #E1E1EA; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-right: 6px; font-family: monospace; }
          .content { font-size: 13px; color: #334155; line-height: 1.7; }
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
            <div style="font-size: 11px; color: #5F6070; margin-top: 2px;">Entorno Educativo Impulsado por Inteligencia Artificial</div>
          </div>
          <div class="meta">
            <div><strong>Autor:</strong> ${authorName} (${authorEmail})</div>
            <div><strong>Fecha:</strong> ${new Date(activeNote.updated_at || activeNote.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div class="pedagogic-badge">
          Apuntes de clase tomados con palabras propias • Base de estudio para acompañamiento con IA
        </div>
        <h1>${activeNote.title || 'Sin Título'}</h1>
        <div class="tags">${tagsHtml}</div>
        <div class="content">${htmlContent}</div>
        <div class="footer">
          Documento exportado para entrega docente desde QUANTUM NOVA • Aprendizaje con IA sin sustitución del estudiante
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

  // Student: Open modal to submit note strictly in PDF format to teacher
  const handleOpenSendPdfModal = async () => {
    if (!currentUser?.id) {
      triggerSecurityToast('Debes iniciar sesión para entregar notas a tu comunidad.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/student/communities', {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentCommunities(data);
        if (data.length > 0) {
          setSelectedTargetCommId(data[0]._id || data[0].id || '');
        }
      }
    } catch (err) {
      console.error(err);
    }
    setShowSendPdfModal(true);
  };

  const handleConfirmSendPdf = async () => {
    if (!selectedTargetCommId || !activeNote) return;
    setIsSubmittingPdf(true);
    try {
      const res = await fetch(`http://localhost:5000/api/student/communities/${selectedTargetCommId}/submit-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || ''
        },
        body: JSON.stringify({
          title: activeNote.title || 'Nota de clase',
          content: activeNote.content || '',
          fileName: `${(activeNote.title || 'apuntes').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.pdf`
        })
      });
      if (res.ok) {
        setShowSendPdfModal(false);
        triggerSecurityToast('¡Nota académica entregada exitosamente en formato PDF al docente!');
      } else {
        alert('Error al entregar la nota');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al entregar nota');
    } finally {
      setIsSubmittingPdf(false);
    }
  };

  // Import .qnote logic
  const handleImportQNote = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64Str = evt.target?.result as string;
        const decoded = decodeURIComponent(escape(atob(base64Str)));
        const data = JSON.parse(decoded);

        if (data.signature !== 'QUANTUM_NOVA_NOTE_V1') {
          alert('Formato de nota no válido o archivo corrupto.');
          return;
        }

        const newNote = await onCreateNote(data.title || 'Nota Importada');
        if (newNote) {
          const updatedNote = {
            ...newNote,
            content: data.content || '',
            tags: data.tags || [],
            images: data.images || []
          };
          await onUpdateNote(updatedNote);
          setActiveNote(updatedNote);
          alert('¡Nota importada con éxito!');
        }
      } catch (err) {
        console.error('Error al importar la nota:', err);
        alert('Error al importar la nota. Asegúrese de que el archivo .qnote es válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    if (!activeNote) return;
    const currentContent = editorRef.current ? editorRef.current.innerHTML : editContent;
    onUpdateNote({
      ...activeNote,
      title: editTitle,
      content: currentContent,
      tags: editTags,
      updated_at: new Date().toISOString()
    });
    triggerSecurityToast('¡Nota guardada exitosamente!');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!editTags.includes(cleanTag)) {
        setEditTags([...editTags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  const handleLinkClick = async (title: string, targetNote?: Note) => {
    if (targetNote) {
      setActiveNote(targetNote);
    } else {
      if (confirm(`La nota "${title}" no existe. ¿Deseas crearla ahora?`)) {
        const newNote = await onCreateNote(title);
        setActiveNote(newNote);
      }
    }
  };

  // High-fidelity visual preview renderer without code or raw markdown
  const renderPreviewContent = (htmlContent: string) => {
    if (!htmlContent || !htmlContent.trim()) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-text-secondary/40 italic text-xs py-20">
          Previsualización vacía. Escribe algo en el editor.
        </div>
      );
    }

    // Process [[Note Title]] bidirectional links into interactive glass pills
    const processed = htmlContent.replace(/\[\[(.*?)\]\]/g, (_m, title) => {
      const trimmed = title.trim();
      const targetNote = notes.find(n => n.title.toLowerCase() === trimmed.toLowerCase());
      const isTarget = !!targetNote;
      return `<button type="button" data-note-title="${encodeURIComponent(trimmed)}" class="note-link-chip inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
        isTarget
          ? 'bg-[#A947E8]/10 text-[#A947E8] border-[#A947E8]/30 hover:bg-[#A947E8]/20'
          : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
      }">🔗 ${trimmed}</button>`;
    });

    return (
      <div
        className="wysiwyg-content text-sm leading-relaxed text-text-primary select-text"
        dangerouslySetInnerHTML={{ __html: processed }}
        onClick={(e) => {
          const chip = (e.target as HTMLElement).closest('.note-link-chip') as HTMLElement;
          if (chip && chip.dataset.noteTitle) {
            e.preventDefault();
            e.stopPropagation();
            const title = decodeURIComponent(chip.dataset.noteTitle);
            const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
            handleLinkClick(title, targetNote);
          }
        }}
      />
    );
  };

  const renderNoteCard = (n: Note) => {
    const isActive = activeNote?.id === n.id;
    const isSel = selectedNoteIds.includes(n.id);

    const handleClick = () => {
      if (isBulkMode) {
        if (isSel) {
          setSelectedNoteIds(prev => prev.filter(id => id !== n.id));
        } else {
          setSelectedNoteIds(prev => [...prev, n.id]);
        }
      } else {
        setActiveNote(n);
      }
    };

    // Clean excerpt: completely remove all HTML tags and markdown symbols for zero code leaks
    const cleanSnippet = n.content
      ? n.content
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/[#*`_~=\-\[\]\(\)]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : '';

    return (
      <button
        key={n.id}
        onClick={handleClick}
        draggable={!isBulkMode}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', n.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        className={`note-card-glass w-full text-left p-3 rounded-xl transition-all cursor-pointer relative group ${
          isActive && !isBulkMode ? 'active-note ring-1 ring-tech-purple/40' : ''
        } ${isBulkMode && isSel ? 'border-tech-purple bg-tech-purple/10' : ''}`}
      >
        <div className="flex items-start gap-2.5">
          {isBulkMode && (
            <div className="mt-0.5 shrink-0 select-none">
              <div
                className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${
                  isSel
                    ? 'bg-tech-purple border-tech-purple text-white shadow-xs'
                    : 'border-border-custom bg-white dark:bg-panel hover:border-tech-purple/60'
                }`}
              >
                {isSel && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}
          <FileText
            className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
              isActive && !isBulkMode ? 'text-tech-purple' : 'text-text-secondary group-hover:text-text-primary'
            }`}
          />
          <div className="space-y-1 overflow-hidden flex-1">
            <h4
              className={`text-xs truncate transition-colors ${
                isActive && !isBulkMode ? 'text-tech-purple font-bold' : 'text-text-primary font-semibold'
              }`}
            >
              {n.title || 'Sin Título'}
            </h4>
            {cleanSnippet ? (
              <p className="text-[11px] text-text-secondary line-clamp-1 leading-relaxed">
                {cleanSnippet}
              </p>
            ) : (
              <p className="text-[10.5px] text-text-secondary/40 italic">Nota vacía</p>
            )}
            {n.tags && n.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {n.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="text-[9.5px] px-1.5 py-0.2 rounded bg-tech-purple/5 dark:bg-white/[0.04] text-text-secondary border border-border-custom/50 font-mono"
                  >
                    {tag}
                  </span>
                ))}
                {n.tags.length > 2 && (
                  <span className="text-[9px] text-text-secondary/60">+{n.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-transparent select-text relative">
      {/* Security Toast notification */}
      {securityToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] pointer-events-none">
          <div className="bg-text-primary border border-border-custom/20 shadow-2xl px-5 py-3 rounded-2xl text-xs font-semibold text-white flex items-center gap-3 max-w-md">
            <div className="w-5 h-5 rounded-full bg-tech-purple/20 border border-tech-purple/30 flex items-center justify-center text-[10px] font-bold shrink-0 text-tech-purple">
              i
            </div>
            <span className="leading-relaxed">{securityToast.message}</span>
          </div>
        </div>
      )}

      {/* Discrete Floating exit Focus Mode button */}
      {readingMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60]">
          <button
            onClick={() => {
              setReadingMode(false);
              setIsSidebarListCollapsed(false);
            }}
            className="bg-white dark:bg-panel hover:bg-bg-secondary border border-border-custom px-5 py-2.5 rounded-full text-xs font-bold text-text-primary flex items-center gap-2 shadow-2xl hover:scale-105 transition-all cursor-pointer"
          >
            <Minimize2 className="w-4 h-4 text-tech-purple" />
            Salir del Modo Enfoque
          </button>
        </div>
      )}

      {/* Sidebar List (hidden on mobile when a note is active/being edited) */}
      {!isSidebarListCollapsed && (!isMobileOrTablet || !activeNote) && (
        <div 
          className="notes-list-sidebar w-80 border-r border-border-custom flex flex-col shrink-0 h-full bg-white dark:bg-panel"
          style={isMobileOrTablet ? { width: '100%', margin: '16px', height: 'calc(100% - 32px)' } : {}}
        >
          <div className="p-4 border-b border-border-custom space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase tracking-wider text-text-primary">Mis Notas</h2>
              <div className="flex items-center gap-1.5">
                <button
                  data-tour="notes-folder-btn"
                  onClick={handleCreateFolder}
                  className="p-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom border border-border-custom text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                  title="Nueva carpeta"
                >
                  <FolderPlus className="w-4 h-4 text-tech-blue" />
                </button>
                <button
                  data-tour="notes-bulk-btn"
                  onClick={() => {
                    setIsBulkMode(!isBulkMode);
                    setSelectedNoteIds([]);
                  }}
                  className={`p-1.5 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                    isBulkMode
                      ? 'bg-tech-purple/10 border-tech-purple text-tech-purple'
                      : 'bg-bg-secondary hover:bg-border-custom border border-border-custom text-text-secondary hover:text-text-primary'
                  }`}
                  title="Selección múltiple"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </button>
                <button
                  data-tour="notes-new-btn"
                  onClick={() => onCreateNote()}
                  className="p-1.5 rounded-lg bg-tech-purple hover:bg-tech-purple-hover text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                  title="Nueva nota"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <input
                  type="file"
                  ref={importInputRef}
                  onChange={handleImportQNote}
                  accept=".qnote"
                  className="hidden"
                />
                <button
                  data-tour="notes-import-btn"
                  onClick={() => importInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom border border-border-custom text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                  title="Importar nota (.qnote)"
                >
                  <Upload className="w-4 h-4 text-tech-purple" />
                </button>
                <button
                  onClick={() => setIsSidebarListCollapsed(true)}
                  className="p-1.5 rounded-lg bg-bg-secondary hover:bg-border-custom border border-border-custom text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                  title="Colapsar lista de notas"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
              <input
                data-tour="notes-search"
                type="text"
                placeholder="Buscar notas o tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-bg-secondary border border-border-custom focus:border-tech-purple rounded-lg py-1.5 pl-9 pr-4 text-xs text-text-primary placeholder:text-text-secondary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Bulk Action Controls Bar */}
          {isBulkMode && (
            <div className="px-4 py-2 border-b border-border-custom bg-bg-secondary flex items-center justify-between shrink-0 select-none animate-fade-in">
              <button
                onClick={handleToggleSelectAll}
                className="text-[10px] text-text-secondary hover:text-text-primary font-bold flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                {selectedNoteIds.length === filteredNotes.length ? 'Ninguno' : 'Todos'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedNoteIds.length === 0}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    selectedNoteIds.length > 0
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40 shadow-xs'
                      : 'bg-bg-secondary text-text-secondary/40 border-border-custom cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Borrar ({selectedNoteIds.length})
                </button>
                <button
                  onClick={() => {
                    setIsBulkMode(false);
                    setSelectedNoteIds([]);
                  }}
                  className="text-[10px] text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-lg border border-border-custom bg-white dark:bg-panel font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Fin
                </button>
              </div>
            </div>
          )}

          {/* Folders & Note Cards List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
            {/* Folders list */}
            {folders.map(folder => {
              const isOpen = !!openFolders[folder.id];
              const folderNotes = folderNotesMap.map[folder.id] || [];

              return (
                <div 
                  key={folder.id} 
                  className={`space-y-1 transition-all rounded-xl p-1 border ${
                    dragOverFolderId === folder.id ? 'bg-tech-purple/5 border-tech-purple shadow-xs' : 'border-transparent'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverFolderId !== folder.id) {
                      setDragOverFolderId(folder.id);
                    }
                  }}
                  onDragLeave={() => {
                    setDragOverFolderId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverFolderId(null);
                    const noteId = e.dataTransfer.getData('text/plain');
                    if (noteId) {
                      await handleMoveNoteToFolder(noteId, folder.id);
                    }
                  }}
                >
                  {/* Folder Header */}
                  <div
                    onClick={() => setOpenFolders(prev => ({ ...prev, [folder.id]: !isOpen }))}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-bg-secondary cursor-pointer group text-xs text-text-primary transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-text-secondary shrink-0" />}
                      <FolderIcon className="w-4 h-4 text-tech-blue shrink-0" />
                      <span className="font-semibold truncate">{folder.name}</span>
                      <span className="text-[10px] text-text-secondary font-mono">({folderNotes.length})</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNote(undefined, folder.id);
                        }}
                        className="p-1 rounded-md hover:bg-border-custom text-text-secondary hover:text-text-primary"
                        title="Nueva nota en carpeta"
                      >
                        <Plus className="w-3.5 h-3.5 text-tech-purple" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        className="p-1 rounded-md hover:bg-red-50 text-text-secondary hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        title="Eliminar carpeta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Folder Notes */}
                  {isOpen && (
                    <div className="pl-3.5 border-l border-border-custom space-y-1 ml-3.5">
                      {folderNotes.length > 0 ? (
                        folderNotes.map(n => renderNoteCard(n))
                      ) : (
                        <div className="text-[10px] text-text-secondary/60 italic p-2">
                          Carpeta vacía
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Notes Folder */}
            <div 
              className={`space-y-1 border-t border-border-custom pt-3 transition-all rounded-xl p-1 border ${
                dragOverFolderId === 'unassigned' ? 'bg-tech-purple/5 border-tech-purple shadow-xs' : 'border-transparent'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverFolderId !== 'unassigned') {
                  setDragOverFolderId('unassigned');
                }
              }}
              onDragLeave={() => {
                setDragOverFolderId(null);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOverFolderId(null);
                const noteId = e.dataTransfer.getData('text/plain');
                if (noteId) {
                  await handleMoveNoteToFolder(noteId, null);
                }
              }}
            >
              <div className="px-2 py-1 text-[9.5px] uppercase tracking-wider text-text-secondary font-bold">
                Notas sueltas
              </div>
              {folderNotesMap.unassigned.length > 0 ? (
                folderNotesMap.unassigned.map(n => renderNoteCard(n))
              ) : (
                <div className="text-[10px] text-text-secondary/60 italic px-2 py-1">
                  Ninguna nota suelta
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor & Previewer Area */}
      <div className="editor-preview-container flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-panel">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="h-14 border-b border-border-custom px-4 md:px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#12121B]/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                {/* Back button to list on mobile */}
                {isMobileOrTablet && (
                  <button
                    onClick={() => setActiveNote(null)}
                    className="mr-1 p-1.5 rounded-lg bg-white dark:bg-panel-secondary border border-border-custom text-text-primary flex items-center gap-1 cursor-pointer hover:bg-bg-secondary transition-colors"
                    title="Volver al listado"
                  >
                    <ChevronLeft className="w-4 h-4 text-tech-purple" />
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Notas</span>
                  </button>
                )}

                {/* Expand sidebar list if collapsed */}
                {!isMobileOrTablet && isSidebarListCollapsed && (
                  <button
                    onClick={() => setIsSidebarListCollapsed(false)}
                    className="p-1.5 rounded-lg bg-white dark:bg-panel-secondary hover:bg-bg-secondary border border-border-custom text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                    title="Mostrar lista de notas"
                  >
                    <ChevronRight className="w-4 h-4 text-tech-purple" />
                  </button>
                )}

                {/* iOS/macOS-Style Segmented Tab selector */}
                <div data-tour="notes-tabs" className="flex items-center bg-slate-200/60 dark:bg-white/[0.08] backdrop-blur-md border border-slate-300/50 dark:border-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'edit' ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Editor</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'preview' ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Vista Previa</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('split')}
                    className={`hidden md:flex px-3 py-1 rounded-lg text-xs font-semibold items-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === 'split' ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Dividido
                  </button>
                </div>
              </div>

              {/* Action buttons (optimized responsively with dropdown wrapper) */}
              <div data-tour="notes-more-actions" className="flex items-center gap-1.5 relative">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Save button (Always visible) */}
                <button
                  data-tour="notes-save-btn"
                  onClick={handleSave}
                  className="p-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all shadow-xs flex items-center justify-center"
                  title="Guardar nota"
                >
                  <Save className="w-4 h-4 text-tech-purple" />
                </button>

                {/* Image upload button (Always visible) */}
                <button
                  data-tour="notes-image-btn"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all shadow-xs flex items-center justify-center"
                  title="Añadir imagen a la nota"
                >
                  <ImageIcon className="w-4 h-4 text-tech-purple" />
                </button>

                {/* Inline Actions on Desktop, Dropdown Menu on Mobile/Tablet */}
                {!isMobileOrTablet ? (
                  <>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        showMap
                          ? 'bg-tech-purple/15 border-tech-purple/60 text-tech-purple ring-1 ring-tech-purple/30'
                          : 'bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={showMap ? "Ocultar Mapa Mental" : "Mostrar Mapa Mental"}
                    >
                      <BrainCircuit className="w-4 h-4 text-tech-purple" /> Mapa
                    </button>
                    <button
                      onClick={() => {
                        setReadingMode(true);
                        setIsSidebarListCollapsed(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Activar Modo Enfoque"
                    >
                      <Maximize2 className="w-4 h-4" /> Enfoque
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Exportar nota a PDF"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                    {currentUser?.role === 'profe' && (
                      <button
                        onClick={handleExportWord}
                        className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Exportar a Word (Docente)"
                      >
                        <FileText className="w-4 h-4" /> Word
                      </button>
                    )}
                    <button
                      onClick={handleExportQNote}
                      className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Exportar nota (.qnote)"
                    >
                      <Download className="w-4 h-4" /> .qnote
                    </button>
                    <button
                      onClick={handleOpenSendPdfModal}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-tech-purple to-[#8233C5] hover:opacity-95 text-white border border-tech-purple/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-tech-purple/25"
                      title="Entregar tus notas en PDF al docente de la comunidad"
                    >
                      <Send className="w-4 h-4" /> Entregar Nota (PDF)
                    </button>
                  </>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className={`p-1.5 rounded-xl border text-slate-700 dark:text-slate-200 cursor-pointer transition-all shadow-xs ${
                        showMoreMenu
                          ? 'bg-tech-purple/15 border-tech-purple/60 text-tech-purple'
                          : 'bg-white/80 hover:bg-white dark:bg-white/[0.06] border-slate-200/80 dark:border-white/10'
                      }`}
                      title="Más acciones"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMoreMenu && (
                      <>
                        <div className="fixed inset-0 z-45" onClick={() => setShowMoreMenu(false)} />
                        
                        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 dark:bg-[#12121B]/95 backdrop-blur-xl border border-border-custom shadow-xl p-1.5 z-50 space-y-0.5">
                          <button
                            onClick={() => {
                              setShowMap(!showMap);
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                          >
                            <BrainCircuit className="w-4 h-4 text-tech-purple" />
                            <span>{showMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setReadingMode(true);
                              setIsSidebarListCollapsed(true);
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span>Enfoque</span>
                          </button>
                          <button
                            onClick={() => {
                              handleExportPDF();
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Exportar PDF</span>
                          </button>
                          {currentUser?.role === 'profe' && (
                            <button
                              onClick={() => {
                                handleExportWord();
                                setShowMoreMenu(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-black/5 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Exportar Word</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleOpenSendPdfModal();
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-tech-purple hover:bg-tech-purple/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4 text-tech-purple" />
                            <span>Entregar Nota (PDF)</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Delete button (Always visible) */}
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
                      onDeleteNote(activeNote.id);
                    }
                  }}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  title="Eliminar nota"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Exam Locked Banner */}
            {isExamLocked && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3.5 shadow-lg backdrop-blur-md animate-fade-in shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-rose-400">
                      Modo Examen Seguro Activo
                    </span>
                    {examLockInfo?.communityName && (
                      <span className="text-[11px] text-text-secondary">
                        • {examLockInfo.communityName} ({examLockInfo.examTitle})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Tus notas de estudio están temporalmente en modo solo-lectura y concentración durante la evaluación en curso. El objetivo es que pienses, analices y demuestres tu propio conocimiento sin recurrir a apoyos externos.
                  </p>
                </div>
              </div>
            )}

            {/* Editing workspace */}
            <div className="flex-1 flex overflow-hidden select-text relative">
              <div className={`flex-1 flex overflow-hidden ${showMap ? 'border-r border-border-custom/40' : ''}`}>
                {/* Editor Workspace */}
                {(activeTab === 'edit' || activeTab === 'split') && (
                  <div
                    data-tour="notes-editor"
                    onContextMenu={handleContextMenu}
                    className="flex-1 flex flex-col p-6 space-y-5 overflow-y-auto border-r border-border-custom/40 bg-white dark:bg-panel"
                  >
                    {/* Note Title Input */}
                    <input
                      type="text"
                      placeholder="Título de la nota..."
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full bg-transparent text-text-primary font-bold text-2xl placeholder:text-text-secondary/40 outline-none border-b border-border-custom pb-2 focus:border-tech-purple transition-colors"
                    />

                    {/* Quick Formatting & Dynamic Highlighting Commands Toolbar (Liquid Glass Apple macOS/iOS) */}
                    <div data-tour="notes-toolbar-highlight" className="flex flex-wrap items-center gap-2 py-2 px-3.5 bg-white/80 dark:bg-white/[0.06] backdrop-blur-2xl border border-white/90 dark:border-white/10 rounded-2xl text-xs shadow-[0_8px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.25)]">
                      <span className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5 select-none">
                        <Edit3 className="w-3.5 h-3.5 text-tech-purple" />
                        <span>Resaltar:</span>
                      </span>
                      
                      {/* Orange Bold Highlight */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => applyHighlight('orange')}
                        className={`px-3 py-1 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                          activeFormats.mark === 'orange'
                            ? 'bg-amber-500/25 border border-amber-500/60 text-amber-900 dark:text-amber-200 font-bold shadow-xs ring-2 ring-amber-500/30 scale-[1.02]'
                            : 'bg-amber-500/10 hover:bg-amber-500/18 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-medium hover:scale-[1.01]'
                        }`}
                        title="Resaltar en Negrita Naranja (Atajo: Ctrl+Shift+O)"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
                        Negrita Naranja
                      </button>

                      {/* Purple Concept Highlight */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => applyHighlight('purple')}
                        className={`px-3 py-1 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                          activeFormats.mark === 'purple'
                            ? 'bg-purple-500/25 border border-purple-500/60 text-purple-900 dark:text-purple-200 font-bold shadow-xs ring-2 ring-purple-500/30 scale-[1.02]'
                            : 'bg-purple-500/10 hover:bg-purple-500/18 border border-purple-500/25 text-purple-800 dark:text-purple-300 font-medium hover:scale-[1.01]'
                        }`}
                        title="Resaltar concepto clave en púrpura"
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs" />
                        Concepto Clave
                      </button>

                      {/* Blue Tech Highlight */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => applyHighlight('blue')}
                        className={`px-3 py-1 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                          activeFormats.mark === 'blue'
                            ? 'bg-blue-500/25 border border-blue-500/60 text-blue-900 dark:text-blue-200 font-bold shadow-xs ring-2 ring-blue-500/30 scale-[1.02]'
                            : 'bg-blue-500/10 hover:bg-blue-500/18 border border-blue-500/25 text-blue-800 dark:text-blue-300 font-medium hover:scale-[1.01]'
                        }`}
                        title="Resaltar idea técnica en azul"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" />
                        Idea Técnica
                      </button>

                      {/* Amber Marker */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => applyHighlight('amber')}
                        className={`px-3 py-1 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                          activeFormats.mark === 'amber'
                            ? 'bg-yellow-500/30 border border-yellow-500/60 text-yellow-950 dark:text-yellow-200 font-bold shadow-xs ring-2 ring-yellow-500/30 scale-[1.02]'
                            : 'bg-yellow-500/15 hover:bg-yellow-500/22 border border-yellow-500/25 text-yellow-800 dark:text-yellow-300 font-medium hover:scale-[1.01]'
                        }`}
                        title="Marcador fluorescente ámbar"
                      >
                        <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-xs" />
                        Marcador Ámbar
                      </button>

                      <div className="h-4 w-px bg-slate-300/70 dark:bg-white/15 mx-1" />

                      {/* Word/Docs-style visual formatting controls */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => executeCommand('bold')}
                        className={`p-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                          activeFormats.bold
                            ? 'bg-tech-purple text-white border border-tech-purple shadow-sm shadow-tech-purple/25 scale-[1.02]'
                            : 'bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-xs'
                        }`}
                        title="Negrita (Ctrl+B)"
                      >
                        <BoldIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => executeCommand('italic')}
                        className={`p-1.5 px-2.5 rounded-xl text-[11px] italic font-serif flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                          activeFormats.italic
                            ? 'bg-tech-purple text-white border border-tech-purple shadow-sm shadow-tech-purple/25 scale-[1.02]'
                            : 'bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-xs'
                        }`}
                        title="Cursiva (Ctrl+I)"
                      >
                        <ItalicIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => executeCommand('underline')}
                        className={`p-1.5 px-2.5 rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                          activeFormats.underline
                            ? 'bg-tech-purple text-white border border-tech-purple shadow-sm shadow-tech-purple/25 scale-[1.02]'
                            : 'bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-xs'
                        }`}
                        title="Subrayado (Ctrl+U)"
                      >
                        <UnderlineIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => executeCommand('formatBlock', activeFormats.heading ? '<p>' : '<h2>')}
                        className={`p-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                          activeFormats.heading
                            ? 'bg-tech-purple text-white border border-tech-purple shadow-sm shadow-tech-purple/25 scale-[1.02]'
                            : 'bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-xs'
                        }`}
                        title="Subtítulo H2"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">H2</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => executeCommand('insertUnorderedList')}
                        className={`p-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all duration-150 ${
                          activeFormats.list
                            ? 'bg-tech-purple text-white border border-tech-purple shadow-sm shadow-tech-purple/25 scale-[1.02]'
                            : 'bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-xs'
                        }`}
                        title="Lista con viñetas"
                      >
                        <ListIcon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Lista</span>
                      </button>

                      <div className="h-4 w-px bg-slate-300/70 dark:bg-white/15 mx-1" />

                      <ContextualHelpBadge
                        title="Enlaces Bidireccionales [[...]]"
                        description="Escribe dos corchetes seguidos del título de otra nota, como [[Nombre de Nota]]. Quantum Nova creará automáticamente un enlace interactivo y conectará ambas ideas en tu Mapa Mental."
                        tooltipText="Ayuda: Enlaces [[...]]"
                        placement="bottom"
                      />
                    </div>

                    {/* Folder & Tags Bar */}
                    <div data-tour="notes-tags-bar" className="flex flex-col md:flex-row gap-4 border-b border-border-custom/60 pb-3 shrink-0">
                      {/* Folder Selector */}
                      <div className="flex items-center gap-2">
                        <FolderIcon className="w-4 h-4 text-tech-blue shrink-0" />
                        <span className="text-xs text-text-secondary font-medium">Carpeta:</span>
                        <select
                          value={activeNote.folder ? (activeNote.folder.id || '') : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            onUpdateNote({
                              ...activeNote,
                              folderId: val === '' ? null : val
                            });
                          }}
                          className="bg-white dark:bg-panel-secondary border border-border-custom hover:border-tech-purple/40 focus:border-tech-purple text-xs text-text-primary rounded-lg px-2.5 py-1 outline-none cursor-pointer shadow-xs"
                        >
                          <option value="">Ninguna (Nota suelta)</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Tags Manager */}
                      <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                        <Hash className="w-4 h-4 text-text-secondary shrink-0" />
                        {editTags.map(tag => (
                          <span
                            key={tag}
                            className="text-[11px] bg-tech-purple/10 text-tech-purple border border-tech-purple/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono font-medium"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="text-tech-purple/70 hover:text-rose-500 cursor-pointer ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="Añadir etiqueta (Enter)..."
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          className="bg-transparent text-xs text-text-primary placeholder:text-text-secondary/60 outline-none border-none py-1 focus:ring-0 min-w-[120px]"
                        />
                      </div>
                    </div>

                    {/* Visual WYSIWYG Editor Content Area */}
                    <div
                      ref={editorRef}
                      contentEditable={!isExamLocked}
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      onKeyUp={checkActiveFormats}
                      onMouseUp={checkActiveFormats}
                      onKeyDown={handleKeyDown}
                      onCopy={preventCopyPaste}
                      onCut={preventCopyPaste}
                      onPaste={preventCopyPaste}
                      data-placeholder="Escribe aquí tu contenido visualmente. Usa [[Título de Nota]] para enlazar ideas..."
                      className="wysiwyg-editor w-full flex-1 bg-transparent text-text-primary outline-none border-none text-sm leading-relaxed min-h-[350px] overflow-y-auto"
                    />
                  </div>
                )}

                {/* Previewer Workspace */}
                {(activeTab === 'preview' || activeTab === 'split') && (
                  <div ref={previewContainerRef} className="relative flex-1 p-6 overflow-y-auto bg-white dark:bg-panel">
                    {activeTab === 'preview' && (
                      <div className="border-b border-border-custom pb-4 mb-4">
                        <h1 className="text-3xl font-bold text-text-primary mb-2">{editTitle || 'Sin Título'}</h1>
                        <div className="flex flex-wrap gap-1.5">
                          {editTags.map(tag => (
                            <span
                              key={tag}
                              className="text-[10px] bg-bg-secondary text-text-secondary border border-border-custom px-2 py-0.5 rounded-md font-mono font-semibold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {editContent ? (
                      <div className="wysiwyg-content markdown-body text-sm text-text-secondary">
                        {renderPreviewContent(editContent)}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-text-secondary/40 italic text-xs py-20">
                        Previsualización vacía. Escribe algo en el editor.
                      </div>
                    )}

                    {/* Render positioned images */}
                    {activeNote.images?.map((img) => (
                      <div
                        key={img.id}
                        style={{
                          position: 'absolute',
                          left: `${img.x}%`,
                          top: `${img.y}%`,
                          width: `${img.width || 200}px`,
                          height: `${img.height || 150}px`,
                          zIndex: 10,
                        }}
                        onMouseDown={(e) => handleImageMouseDown(img.id, e)}
                        className="group border border-border-custom hover:border-tech-purple/60 bg-white dark:bg-panel rounded-xl overflow-hidden shadow-lg cursor-move transition-shadow duration-300 select-none"
                      >
                        {/* Image source */}
                        <img
                          src={img.url}
                          alt={img.caption || 'Imagen'}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        
                        {/* Caption Overlay */}
                        {img.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-[10.5px] px-2.5 py-1.5 truncate pointer-events-none font-sans">
                            {img.caption}
                          </div>
                        )}

                        {/* Actions bar (hover) */}
                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditImageCaption(img.id);
                            }}
                            className="p-1 rounded-md bg-white/90 dark:bg-panel hover:bg-white border border-border-custom text-text-secondary hover:text-tech-purple cursor-pointer flex items-center justify-center shadow-xs"
                            title="Editar nota de imagen"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(img.id);
                            }}
                            className="p-1 rounded-md bg-rose-500/25 hover:bg-rose-500/40 border border-rose-500/40 text-rose-400 hover:text-rose-200 cursor-pointer flex items-center justify-center"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Resize Handle */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(img.id, e)}
                          className="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end pointer-events-auto"
                          title="Cambiar tamaño"
                        >
                          <svg className="w-2.5 h-2.5 text-text-secondary/70 group-hover:text-tech-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M21 15v6h-6M21 21L12 12" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right split: interactive Knowledge Map */}
              {showMap && (
                <div className="w-1/2 h-full flex flex-col overflow-hidden bg-bg-secondary/10 shrink-0 border-l border-border-custom">
                  <MindMapView
                    notes={notes}
                    onNodeClick={noteId => {
                      const matched = notes.find(n => n.id === noteId);
                      if (matched) {
                        setActiveNote(matched);
                      }
                    }}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          // Inactive Note state
          <div data-tour="notes-editor" className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 relative bg-[#F7F7FB] dark:bg-bg-primary">
            {isSidebarListCollapsed && (
              <button
                onClick={() => setIsSidebarListCollapsed(false)}
                className="absolute top-4 left-4 p-1.5 rounded-lg bg-white dark:bg-panel-secondary hover:bg-bg-secondary border border-border-custom text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="Expandir lista de notas"
              >
                <ChevronRight className="w-4.5 h-4.5 text-tech-purple" />
              </button>
            )}

            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-panel border border-border-custom flex items-center justify-center text-tech-purple shadow-xs">
              <FileText className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-base font-bold text-text-primary">Ninguna Nota Seleccionada</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Selecciona una nota existente de la barra lateral o haz clic en el botón **"+"** superior para crear una nueva nota y empezar a construir tu segunda mente digital.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-panel border border-border-custom text-left text-xs max-w-sm space-y-2 shadow-xs">
              <div className="flex items-center gap-1.5 text-tech-purple font-semibold">
                <Info className="w-4 h-4 shrink-0" />
                <span>¿Cómo funciona el enlazado bidireccional?</span>
              </div>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                En cualquier parte del texto de tus notas escribe `[[` seguido del título de otra nota y ciérralo con `]]`.
                Por ejemplo: `[[Método Feynman]]`. QuantumNova lo convertirá automáticamente en un enlace dinámico clickable.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 select-none cursor-zoom-out animate-fade-in"
        >
          {/* Image Container */}
          <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center">
            <img
              src={activeLightbox}
              alt="Ampliada"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-white/10 shadow-2xl"
            />
          </div>

          {/* Caption */}
          {lightboxCaption && (
            <div className="mt-4 max-w-xl text-center text-sm font-semibold text-white/95 px-4 py-2 bg-panel/60 border border-white/10 rounded-2xl backdrop-blur-md">
              {lightboxCaption}
            </div>
          )}

          {/* Close instruction */}
          <span className="absolute top-4 right-4 text-xs font-bold uppercase tracking-wider text-text-secondary bg-panel/30 border border-white/10 px-3 py-1.5 rounded-full">
            Haz clic en cualquier parte para cerrar
          </span>
        </div>
      )}

      {/* Modal: Entregar Nota en PDF al Docente */}
      {showSendPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-panel border border-border-custom shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Send className="w-4 h-4 text-tech-purple" />
              Entregar Apuntes en PDF a tu Profesor
            </h3>
            <p className="text-xs text-text-secondary">
              Tus apuntes elaborados con tus propias palabras serán entregados en formato <strong>PDF oficial</strong> al Buzón de Entregas de la clase.
            </p>

            <div className="p-3.5 rounded-xl bg-[#F3F2F8] dark:bg-panel-secondary border border-border-custom text-xs">
              <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                <span>Formato de entrega:</span>
                <span className="font-bold text-tech-purple bg-tech-purple/10 px-2 py-0.5 rounded">PDF Oficial</span>
              </div>
              <div className="font-semibold text-text-primary">{activeNote?.title || 'Sin Título'}</div>
              <div className="text-[11px] text-text-secondary line-clamp-2 mt-1 font-mono">
                {activeNote?.content?.replace(/<[^>]*>?/gm, '').replace(/[#*`_\-\[\]]/g, '').trim() || 'Sin contenido'}
              </div>
            </div>

            {studentCommunities.length > 0 ? (
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                  Selecciona la clase / comunidad destinataria:
                </label>
                <select
                  value={selectedTargetCommId}
                  onChange={(e) => setSelectedTargetCommId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-panel-secondary border border-border-custom text-xs text-text-primary focus:outline-none focus:border-tech-purple"
                >
                  {studentCommunities.map(c => {
                    const cid = c._id || c.id || '';
                    return (
                      <option key={cid} value={cid}>
                        {c.name} ({c.teacherName || 'Docente'})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs">
                Aún no estás inscrito en ninguna comunidad de clase. Puedes unirte desde la pestaña <strong>"Comunidades"</strong> ingresando el código proporcionado por tu profesor.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSendPdfModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedTargetCommId || isSubmittingPdf}
                onClick={handleConfirmSendPdf}
                className={`px-4 py-2 rounded-xl bg-tech-purple hover:bg-tech-purple/90 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                  !selectedTargetCommId || isSubmittingPdf ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmittingPdf ? 'Entregando PDF...' : 'Confirmar Entrega en PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
