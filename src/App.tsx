import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  PhotoItem,
  Stamp,
  StampStyle,
  NumberingConfig,
  EditorMode,
  CustomFont,
  HistoryAction,
} from './types';
import {
  DEFAULT_STAMP_STYLE,
  DEFAULT_NUMBERING_CONFIG,
  RECENT_COLORS_DEFAULT,
  FAVORITE_COLORS_DEFAULT,
  formatStampNumber,
  createSampleCollageDataUrl,
  createSamplePortraitDataUrl,
} from './utils/defaults';
import {
  saveProject,
  getProject,
  listProjects,
  getSetting,
  setSetting,
  saveCustomFont,
} from './utils/storage';
import { initStoredFonts, importFontFromFile, removeCustomFont } from './utils/fonts';
import { TopBar } from './components/TopBar';
import { CanvasEditor } from './components/CanvasEditor';
import { BottomToolbar } from './components/BottomToolbar';
import { PhotoStrip } from './components/PhotoStrip';
import { StylePanel } from './components/StylePanel';
import { SetupModal } from './components/SetupModal';
import { ExportModal } from './components/ExportModal';
import { RenumberModal } from './components/RenumberModal';
import { ProjectsModal } from './components/ProjectsModal';
import { TutorialModal } from './components/TutorialModal';
import { ConfirmModal } from './components/ConfirmModal';
import { BatchNumberModal } from './components/BatchNumberModal';
import { PageManagerModal } from './components/PageManagerModal';
import { AIAutoNumberModal } from './components/AIAutoNumberModal';
import {
  analyzeImageForAutoNumbering,
  addSingleImageTopMargin,
  addCompositeRowSpacing,
} from './utils/aiAutoNumber';
import {
  Images,
  FolderOpen,
  Settings,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Sliders,
  Hash,
  Play,
  CheckCircle2,
  FileImage,
} from 'lucide-react';

export default function App() {
  // Screen state: 'home' | 'import_review' | 'editor'
  const [screen, setScreen] = useState<'home' | 'import_review' | 'editor'>('home');

  // Active Project state
  const [project, setProject] = useState<Project>({
    id: `proj_${Date.now()}`,
    name: 'My Numbered Photos',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    photos: [],
    stamps: [],
    numberingConfig: { ...DEFAULT_NUMBERING_CONFIG },
    defaultStyle: { ...DEFAULT_STAMP_STYLE },
    recentColors: [...RECENT_COLORS_DEFAULT],
    favoriteColors: [...FAVORITE_COLORS_DEFAULT],
  });

  // Editor states
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('place');
  const [isPhotoStripOpen, setIsPhotoStripOpen] = useState<boolean>(true);

  // Modals & Panels
  const [isStylePanelOpen, setIsStylePanelOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isInitialSetupOpen, setIsInitialSetupOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isRenumberModalOpen, setIsRenumberModalOpen] = useState<boolean>(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPageManagerOpen, setIsPageManagerOpen] = useState<boolean>(false);
  const [isBatchNumberModalOpen, setIsBatchNumberModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isAIRunning, setIsAIRunning] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<{
    current: number;
    total: number;
    message: string;
    step?: string;
  } | null>(null);
  const [aiManualOverride, setAiManualOverride] = useState<{
    photoIndex: number;
    photoId: string;
    remainingQueue: number[];
    nextSequenceNumber: number;
    placedCoords: Array<{ x: number; y: number; text: string; stampId: string }>;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    icon?: 'trash' | 'warning';
    previewImage?: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  }, []);

  // Custom fonts state
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  // Auto-advance to next photo after placing stamp
  const [autoAdvance, setAutoAdvance] = useState<boolean>(false);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize stored fonts & check tutorial on mount
  useEffect(() => {
    async function init() {
      const fonts = await initStoredFonts();
      setCustomFonts(fonts);

      const seenTutorial = await getSetting('seenTutorial', false);
      if (!seenTutorial) {
        setIsTutorialOpen(true);
        await setSetting('seenTutorial', true);
      }

      // Check for last active project
      const lastProjId = await getSetting<string | null>('lastActiveProjectId', null);
      if (lastProjId) {
        const p = await getProject(lastProjId);
        if (p && p.photos && p.photos.length > 0) {
          setProject(p);
        }
      }
    }
    init();
  }, []);

  // Auto-save project whenever it changes
  useEffect(() => {
    if (project.photos.length > 0) {
      saveProject(project).catch(console.error);
      setSetting('lastActiveProjectId', project.id).catch(console.error);
    }
  }, [project]);

  // Read files into PhotoItem objects
  const processImageFiles = async (fileList: FileList): Promise<PhotoItem[]> => {
    const newItems: PhotoItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Determine natural dimensions
        const dims = await new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || 1200, height: img.naturalHeight || 900 });
          img.onerror = () => resolve({ width: 1200, height: 900 });
          img.src = dataUrl;
        });

        newItems.push({
          id: `photo_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          dataUrl,
          width: dims.width,
          height: dims.height,
          order: project.photos.length + i,
        });
      } catch (err) {
        console.error('Failed to read image', file.name, err);
      }
    }
    return newItems;
  };

  // Primary Action: User selects photos from gallery
  const handleSelectPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newItems = await processImageFiles(e.target.files);
    e.target.value = '';

    if (newItems.length > 0) {
      setProject((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newItems],
        updatedAt: Date.now(),
      }));
      setScreen('import_review');
    }
  };

  // Starter Demo: Load sample collage & portrait photos
  const handleLoadSampleCollage = async () => {
    const collage = await createSampleCollageDataUrl();
    const portrait = await createSamplePortraitDataUrl();

    const samplePhotos: PhotoItem[] = [
      {
        id: `photo_sample_collage_${Date.now()}`,
        name: 'Quad_Panel_Collage.jpg',
        dataUrl: collage.dataUrl,
        width: collage.width,
        height: collage.height,
        order: 0,
      },
      {
        id: `photo_sample_portrait_${Date.now()}`,
        name: 'Portrait_Inspection.jpg',
        dataUrl: portrait.dataUrl,
        width: portrait.width,
        height: portrait.height,
        order: 1,
      },
    ];

    const newProj: Project = {
      id: `proj_demo_${Date.now()}`,
      name: 'Collage & Photo Demo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photos: samplePhotos,
      stamps: [],
      numberingConfig: { ...DEFAULT_NUMBERING_CONFIG },
      defaultStyle: { ...DEFAULT_STAMP_STYLE },
      recentColors: [...RECENT_COLORS_DEFAULT],
      favoriteColors: [...FAVORITE_COLORS_DEFAULT],
    };

    setProject(newProj);
    setCurrentPhotoIndex(0);
    setScreen('import_review');
  };

  // Add more photos inside editor or import review
  const handleAddMorePhotos = async (fileList: FileList) => {
    const newItems = await processImageFiles(fileList);
    if (newItems.length > 0) {
      setProject((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newItems],
        updatedAt: Date.now(),
      }));
    }
  };

  // Delete photo safely
  const handleDeletePhoto = (photoId: string) => {
    setProject((prev) => {
      const filteredPhotos = prev.photos.filter((p) => p.id !== photoId);
      const filteredStamps = prev.stamps.filter((s) => s.photoId !== photoId);
      return {
        ...prev,
        photos: filteredPhotos,
        stamps: filteredStamps,
        updatedAt: Date.now(),
      };
    });
    if (currentPhotoIndex >= project.photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, project.photos.length - 2));
    }
  };

  const promptDeletePhoto = (photoId: string) => {
    const target = project.photos.find((p) => p.id === photoId);
    if (!target) return;
    const pIdx = project.photos.findIndex((p) => p.id === photoId);
    const pageNum = pIdx + 1;
    const stampsOnPhoto = project.stamps.filter((s) => s.photoId === photoId).length;

    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Page #${pageNum}?`,
      message: `Are you sure you want to delete "${target.name}"? This will remove this page and its ${stampsOnPhoto} ${stampsOnPhoto === 1 ? 'stamp' : 'stamps'}.`,
      confirmText: 'Delete Page',
      confirmVariant: 'danger',
      icon: 'trash',
      previewImage: target.dataUrl,
      onConfirm: () => {
        handleDeletePhoto(photoId);
        setConfirmModalConfig(null);
        showToast(`Page #${pageNum} deleted`);
      },
    });
  };

  const handleDeleteMultiplePhotos = (photoIds: string[]) => {
    if (photoIds.length === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete ${photoIds.length} Pages?`,
      message: `Are you sure you want to permanently delete these ${photoIds.length} pages and their stamps?`,
      confirmText: `Delete ${photoIds.length} Pages`,
      confirmVariant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        const idSet = new Set(photoIds);
        setProject((prev) => ({
          ...prev,
          photos: prev.photos.filter((p) => !idSet.has(p.id)),
          stamps: prev.stamps.filter((s) => !idSet.has(s.photoId)),
          updatedAt: Date.now(),
        }));
        setCurrentPhotoIndex(0);
        setSelectedStampId(null);
        setConfirmModalConfig(null);
        showToast(`${photoIds.length} pages deleted`);
      },
    });
  };

  // Delete all pages (Clear all pages so user can finish and delete them all)
  const promptDeleteAllPages = () => {
    if (project.photos.length === 0) return;
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete All ${project.photos.length} Pages?`,
      message: `Are you sure you want to delete all pages and their stamps? This will clear the project so you can start fresh.`,
      confirmText: 'Delete All Pages',
      confirmVariant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setProject((prev) => ({
          ...prev,
          photos: [],
          stamps: [],
          updatedAt: Date.now(),
        }));
        setCurrentPhotoIndex(0);
        setSelectedStampId(null);
        setIsPageManagerOpen(false);
        setConfirmModalConfig(null);
        setScreen('home');
        showToast('All pages deleted. Ready for new photos!');
      },
    });
  };

  // Clear all stamps on current page
  const promptClearCurrentPageStamps = () => {
    const photo = project.photos[currentPhotoIndex];
    if (!photo) return;
    const pageStamps = project.stamps.filter((s) => s.photoId === photo.id);
    if (pageStamps.length === 0) {
      showToast(`No stamps on Page ${currentPhotoIndex + 1} to clear`);
      return;
    }

    setConfirmModalConfig({
      isOpen: true,
      title: `Clear Stamps on Page #${currentPhotoIndex + 1}?`,
      message: `Are you sure you want to remove all ${pageStamps.length} stamps from Page ${currentPhotoIndex + 1}?`,
      confirmText: 'Clear Stamps',
      confirmVariant: 'warning',
      icon: 'trash',
      previewImage: photo.dataUrl,
      onConfirm: () => {
        setUndoStack((prev) => [
          ...prev,
          {
            type: 'renumber_all',
            previousStamps: [...project.stamps],
            nextStamps: project.stamps.filter((s) => s.photoId !== photo.id),
          },
        ]);
        setProject((prev) => ({
          ...prev,
          stamps: prev.stamps.filter((s) => s.photoId !== photo.id),
          updatedAt: Date.now(),
        }));
        setSelectedStampId(null);
        setConfirmModalConfig(null);
        showToast(`Cleared stamps on Page #${currentPhotoIndex + 1}`);
      },
    });
  };

  // Reorder photo
  const handleMovePhoto = (idx: number, direction: 'prev' | 'next') => {
    const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= project.photos.length) return;

    setProject((prev) => {
      const copy = [...prev.photos];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, photos: copy, updatedAt: Date.now() };
    });

    if (currentPhotoIndex === idx) {
      setCurrentPhotoIndex(targetIdx);
    }
  };

  // CORE WORKFLOW: Place Stamp at (normX, normY)
  const handlePlaceStamp = (normX: number, normY: number) => {
    const currentPhoto = project.photos[currentPhotoIndex];
    if (!currentPhoto) return;

    const currentNumber = project.numberingConfig.currentNumber;
    const stampText = formatStampNumber(currentNumber, project.numberingConfig);

    const newStamp: Stamp = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      photoId: currentPhoto.id,
      text: stampText,
      sequenceIndex: currentNumber,
      x: normX,
      y: normY,
      scale: 1,
      rotation: 0,
      style: JSON.parse(JSON.stringify(project.defaultStyle)),
      createdAt: Date.now(),
    };

    // Push to undo stack
    setUndoStack((prev) => [
      ...prev,
      {
        type: 'add_stamp',
        stamp: newStamp,
        previousNumberingConfig: { ...project.numberingConfig },
      },
    ]);
    setRedoStack([]); // clear redo stack on new action

    // Advance sequence number continuous across photos
    const nextNumber = currentNumber + project.numberingConfig.increment;

    setProject((prev) => ({
      ...prev,
      stamps: [...prev.stamps, newStamp],
      numberingConfig: {
        ...prev.numberingConfig,
        currentNumber: nextNumber,
      },
      updatedAt: Date.now(),
    }));

    // Auto-select newly placed stamp so handles and action buttons appear immediately
    setSelectedStampId(newStamp.id);

    // If autoAdvance is enabled and not at the last photo, advance to the next photo
    if (autoAdvance && currentPhotoIndex < project.photos.length - 1) {
      setCurrentPhotoIndex((prev) => prev + 1);
      setSelectedStampId(null);
      showToast(`Placed ${stampText} → Moved to Page ${currentPhotoIndex + 2}`);
    } else {
      showToast(`Placed ${stampText} on Page ${currentPhotoIndex + 1}`);
    }
  };

  // BATCH NUMBERING: Places consecutive numbers across all photos in project
  const handleBatchNumberAllPhotos = (customX?: number, customY?: number) => {
    if (project.photos.length === 0) return;

    // Use selected stamp or first existing stamp or bottom-right
    const selected = project.stamps.find((s) => s.id === selectedStampId);
    const refStamp = selected || project.stamps[0];

    const targetX = customX !== undefined ? customX : refStamp ? refStamp.x : 0.85;
    const targetY = customY !== undefined ? customY : refStamp ? refStamp.y : 0.90;
    const stampStyle = refStamp ? { ...refStamp.style } : { ...project.defaultStyle };

    const startNum = project.numberingConfig.startNumber || 1;
    const inc = project.numberingConfig.increment || 1;
    const cfg = project.numberingConfig;

    const newStamps: Stamp[] = project.photos.map((photo, idx) => {
      const num = startNum + idx * inc;
      return {
        id: `stamp_batch_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        photoId: photo.id,
        text: formatStampNumber(num, cfg),
        sequenceIndex: num,
        x: targetX,
        y: targetY,
        scale: refStamp?.scale || 1,
        rotation: refStamp?.rotation || 0,
        style: stampStyle,
        createdAt: Date.now() + idx,
      };
    });

    const nextUpcoming = startNum + project.photos.length * inc;

    setUndoStack((prev) => [
      ...prev,
      {
        type: 'renumber_all',
        previousStamps: [...project.stamps],
        nextStamps: newStamps,
        previousNumberingConfig: { ...project.numberingConfig },
        nextNumberingConfig: { ...project.numberingConfig, currentNumber: nextUpcoming },
      },
    ]);
    setRedoStack([]);

    setProject((prev) => ({
      ...prev,
      stamps: newStamps,
      numberingConfig: {
        ...prev.numberingConfig,
        currentNumber: nextUpcoming,
      },
      updatedAt: Date.now(),
    }));
  };

  // AI IMAGE AUTO-NUMBERING SYSTEM (Specification Steps 1-4)
  const handleStartAIAutoNumbering = async (scope: 'all' | 'current') => {
    if (project.photos.length === 0) return;

    setIsAIRunning(true);
    const queue = scope === 'all'
      ? project.photos.map((_, i) => i)
      : [currentPhotoIndex];

    await processAIQueue(queue, project.numberingConfig.currentNumber);
  };

  const processAIQueue = async (queue: number[], startSequenceNum: number) => {
    let currentSeq = startSequenceNum;
    let placedTotal = 0;
    const cfg = project.numberingConfig;
    const inc = cfg.increment || 1;

    for (let qIdx = 0; qIdx < queue.length; qIdx++) {
      const pIdx = queue[qIdx];
      const photo = project.photos[pIdx];
      if (!photo) continue;

      setCurrentPhotoIndex(pIdx);
      setAiProgress({
        current: qIdx + 1,
        total: queue.length,
        message: `Step 1 & 2: Classifying & finding corner placements for Page ${pIdx + 1}...`,
        step: 'classification',
      });

      // Analyze image via server Gemini 3.8 Flash endpoint (or client heuristic fallback)
      const result = await analyzeImageForAutoNumbering(photo, pIdx, project.photos.length);

      // STEP 4: Manual Override Exception
      // If AI fails to split or process a composite image:
      if (result.manualOverrideRequired || !result.compositeSuccess) {
        setIsAIRunning(false);
        setIsAIModalOpen(false);
        setAiManualOverride({
          photoIndex: pIdx,
          photoId: photo.id,
          remainingQueue: queue.slice(qIdx + 1),
          nextSequenceNumber: currentSeq,
          placedCoords: [],
        });
        showToast(`AI paused: Tap locations for Collage #${pIdx + 1}`);
        return; // Pause automated process until user confirms manual placement!
      }

      // STEP 3: Fallback Margins (If No Corners are Valid)
      let photoDataUrl = photo.dataUrl;
      let photoW = photo.width;
      let photoH = photo.height;
      let targetStampsCoords: Array<{ x: number; y: number }> = [];

      if (result.needsFallbackMargin) {
        setAiProgress({
          current: qIdx + 1,
          total: queue.length,
          message: `Step 3: Applying Fallback Margin without distorting image on Page ${pIdx + 1}...`,
          step: 'margins',
        });

        if (result.classification === 'single' || result.marginType === 'single-top-margin') {
          const marginRes = await addSingleImageTopMargin(photo);
          photoDataUrl = marginRes.updatedDataUrl;
          photoW = marginRes.newWidth;
          photoH = marginRes.newHeight;
          targetStampsCoords = [marginRes.stampCoord];
        } else {
          // Composite row spacing fallback
          const marginRes = await addCompositeRowSpacing(photo, result.panels);
          photoDataUrl = marginRes.updatedDataUrl;
          photoW = marginRes.newWidth;
          photoH = marginRes.newHeight;
          targetStampsCoords = marginRes.updatedPanels.map((p) => p.stampCoord);
        }

        // Update photo canvas with newly added top/row margins without distortion
        setProject((prev) => ({
          ...prev,
          photos: prev.photos.map((p, i) =>
            i === pIdx ? { ...p, dataUrl: photoDataUrl, width: photoW, height: photoH } : p
          ),
          updatedAt: Date.now(),
        }));
      } else {
        // STEP 2: Preferred Placement Rules (Corner priority order: Upper-Left, Upper-Right, Lower-Left, Lower-Right)
        targetStampsCoords = result.panels.map((p) => p.suggestedCoord);
      }

      // Generate sequential stamps
      const newStamps: Stamp[] = targetStampsCoords.map((coord, idx) => {
        const num = currentSeq + idx * inc;
        const stampText = formatStampNumber(num, cfg);
        return {
          id: `stamp_ai_${Date.now()}_${pIdx}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          photoId: photo.id,
          text: stampText,
          sequenceIndex: num,
          x: coord.x,
          y: coord.y,
          scale: 1,
          rotation: 0,
          style: { ...project.defaultStyle },
          createdAt: Date.now() + idx,
        };
      });

      currentSeq += targetStampsCoords.length * inc;
      placedTotal += newStamps.length;

      // Commit stamps for this photo
      setProject((prev) => ({
        ...prev,
        stamps: [...prev.stamps.filter((s) => s.photoId !== photo.id), ...newStamps],
        numberingConfig: {
          ...prev.numberingConfig,
          currentNumber: currentSeq,
        },
        updatedAt: Date.now(),
      }));

      await new Promise((r) => setTimeout(r, 200));
    }

    setIsAIRunning(false);
    setIsAIModalOpen(false);
    setAiProgress(null);
    showToast(`AI Auto-numbering completed! Numbered ${placedTotal} items.`);
  };

  // STEP 4: Manual Override Tap Handler
  const handleManualOverrideTap = (normX: number, normY: number) => {
    if (!aiManualOverride) return;
    const currentCount = aiManualOverride.placedCoords.length;
    const num = aiManualOverride.nextSequenceNumber + currentCount * (project.numberingConfig.increment || 1);
    const text = formatStampNumber(num, project.numberingConfig);
    const stampId = `stamp_override_${Date.now()}_${currentCount}`;

    const newStamp: Stamp = {
      id: stampId,
      photoId: aiManualOverride.photoId,
      text,
      sequenceIndex: num,
      x: normX,
      y: normY,
      scale: 1,
      rotation: 0,
      style: { ...project.defaultStyle },
      createdAt: Date.now(),
    };

    setProject((prev) => ({
      ...prev,
      stamps: [...prev.stamps, newStamp],
      updatedAt: Date.now(),
    }));

    setAiManualOverride((prev) =>
      prev
        ? {
            ...prev,
            placedCoords: [...prev.placedCoords, { x: normX, y: normY, text, stampId }],
          }
        : null
    );
  };

  const handleUndoManualOverrideTap = () => {
    if (!aiManualOverride || aiManualOverride.placedCoords.length === 0) return;
    const last = aiManualOverride.placedCoords[aiManualOverride.placedCoords.length - 1];

    setProject((prev) => ({
      ...prev,
      stamps: prev.stamps.filter((s) => s.id !== last.stampId),
      updatedAt: Date.now(),
    }));

    setAiManualOverride((prev) =>
      prev
        ? {
            ...prev,
            placedCoords: prev.placedCoords.slice(0, -1),
          }
        : null
    );
  };

  const handleConfirmManualOverride = async () => {
    if (!aiManualOverride) return;
    const placedCount = aiManualOverride.placedCoords.length;
    const nextSeq = aiManualOverride.nextSequenceNumber + placedCount * (project.numberingConfig.increment || 1);
    const remaining = [...aiManualOverride.remainingQueue];

    setProject((prev) => ({
      ...prev,
      numberingConfig: {
        ...prev.numberingConfig,
        currentNumber: nextSeq,
      },
      updatedAt: Date.now(),
    }));

    setAiManualOverride(null);

    if (remaining.length > 0) {
      showToast(`Resuming AI auto-numbering on next page...`);
      setIsAIRunning(true);
      setIsAIModalOpen(true);
      await processAIQueue(remaining, nextSeq);
    } else {
      showToast(`AI Auto-numbering completed!`);
    }
  };

  // Update existing stamp (position, scale, rotation, text, style)
  const handleUpdateStamp = (stampId: string, updates: Partial<Stamp>) => {
    const existing = project.stamps.find((s) => s.id === stampId);
    if (!existing) return;

    setUndoStack((prev) => [
      ...prev,
      {
        type: 'modify_stamp',
        stamp: { ...existing, ...updates },
        previousStamp: { ...existing },
      },
    ]);

    setProject((prev) => ({
      ...prev,
      stamps: prev.stamps.map((s) => (s.id === stampId ? { ...s, ...updates } : s)),
      updatedAt: Date.now(),
    }));
  };

  // Delete stamp
  const handleDeleteStamp = (stampId: string) => {
    const existing = project.stamps.find((s) => s.id === stampId);
    if (!existing) return;

    setUndoStack((prev) => [
      ...prev,
      {
        type: 'delete_stamp',
        stamp: existing,
      },
    ]);

    setProject((prev) => ({
      ...prev,
      stamps: prev.stamps.filter((s) => s.id !== stampId),
      updatedAt: Date.now(),
    }));

    if (selectedStampId === stampId) {
      setSelectedStampId(null);
    }
    showToast('Stamp deleted');
  };

  // Duplicate stamp
  const handleDuplicateStamp = (stampId: string) => {
    const orig = project.stamps.find((s) => s.id === stampId);
    if (!orig) return;

    const dup: Stamp = {
      ...orig,
      id: `stamp_${Date.now()}_dup`,
      x: Math.min(0.95, orig.x + 0.04),
      y: Math.min(0.95, orig.y + 0.04),
      createdAt: Date.now(),
    };

    setUndoStack((prev) => [
      ...prev,
      {
        type: 'add_stamp',
        stamp: dup,
      },
    ]);

    setProject((prev) => ({
      ...prev,
      stamps: [...prev.stamps, dup],
      updatedAt: Date.now(),
    }));
    setSelectedStampId(dup.id);
  };

  // UNDO Action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (lastAction.type === 'add_stamp' && lastAction.stamp) {
      // Remove stamp and roll sequence back
      const stampId = lastAction.stamp.id;
      setRedoStack((prev) => [...prev, lastAction]);

      setProject((prev) => ({
        ...prev,
        stamps: prev.stamps.filter((s) => s.id !== stampId),
        numberingConfig: lastAction.previousNumberingConfig
          ? { ...lastAction.previousNumberingConfig }
          : prev.numberingConfig,
        updatedAt: Date.now(),
      }));

      if (selectedStampId === stampId) setSelectedStampId(null);
    } else if (lastAction.type === 'delete_stamp' && lastAction.stamp) {
      // Restore deleted stamp
      const restored = lastAction.stamp;
      setRedoStack((prev) => [...prev, lastAction]);

      setProject((prev) => ({
        ...prev,
        stamps: [...prev.stamps, restored],
        updatedAt: Date.now(),
      }));
      setSelectedStampId(restored.id);
    } else if (lastAction.type === 'modify_stamp' && lastAction.previousStamp) {
      const prevStamp = lastAction.previousStamp;
      setRedoStack((prev) => [...prev, lastAction]);

      setProject((prev) => ({
        ...prev,
        stamps: prev.stamps.map((s) => (s.id === prevStamp.id ? prevStamp : s)),
        updatedAt: Date.now(),
      }));
    } else if (lastAction.type === 'renumber_all' && lastAction.previousStamps && lastAction.previousNumberingConfig) {
      setRedoStack((prev) => [...prev, lastAction]);
      setProject((prev) => ({
        ...prev,
        stamps: lastAction.previousStamps!,
        numberingConfig: lastAction.previousNumberingConfig!,
        updatedAt: Date.now(),
      }));
    }
  };

  // REDO Action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    if (nextAction.type === 'add_stamp' && nextAction.stamp) {
      setUndoStack((prev) => [...prev, nextAction]);
      const nextNum = nextAction.stamp.sequenceIndex + project.numberingConfig.increment;

      setProject((prev) => ({
        ...prev,
        stamps: [...prev.stamps, nextAction.stamp!],
        numberingConfig: {
          ...prev.numberingConfig,
          currentNumber: nextNum,
        },
        updatedAt: Date.now(),
      }));
    } else if (nextAction.type === 'delete_stamp' && nextAction.stamp) {
      setUndoStack((prev) => [...prev, nextAction]);
      const id = nextAction.stamp.id;

      setProject((prev) => ({
        ...prev,
        stamps: prev.stamps.filter((s) => s.id !== id),
        updatedAt: Date.now(),
      }));
    } else if (nextAction.type === 'modify_stamp' && nextAction.stamp) {
      setUndoStack((prev) => [...prev, nextAction]);
      const st = nextAction.stamp;

      setProject((prev) => ({
        ...prev,
        stamps: prev.stamps.map((s) => (s.id === st.id ? st : s)),
        updatedAt: Date.now(),
      }));
    } else if (nextAction.type === 'renumber_all' && nextAction.nextStamps && nextAction.nextNumberingConfig) {
      setUndoStack((prev) => [...prev, nextAction]);
      setProject((prev) => ({
        ...prev,
        stamps: nextAction.nextStamps!,
        numberingConfig: nextAction.nextNumberingConfig!,
        updatedAt: Date.now(),
      }));
    }
  };

  // Renumber All Handler
  const handleApplyRenumber = (renumberedStamps: Stamp[], newConfig: NumberingConfig) => {
    setUndoStack((prev) => [
      ...prev,
      {
        type: 'renumber_all',
        previousStamps: [...project.stamps],
        nextStamps: renumberedStamps,
        previousNumberingConfig: { ...project.numberingConfig },
        nextNumberingConfig: { ...newConfig },
      },
    ]);
    setRedoStack([]);

    setProject((prev) => ({
      ...prev,
      stamps: renumberedStamps,
      numberingConfig: newConfig,
      updatedAt: Date.now(),
    }));
  };

  // Font importing
  const handleImportFontFile = async (file: File) => {
    const imported = await importFontFromFile(file);
    setCustomFonts((prev) => [...prev, imported]);
  };

  const handleDeleteCustomFont = async (fontId: string) => {
    await removeCustomFont(fontId);
    setCustomFonts((prev) => prev.filter((f) => f.id !== fontId));
  };

  const handleRenameCustomFont = async (fontId: string, newName: string) => {
    const font = customFonts.find((f) => f.id === fontId);
    if (!font) return;
    const updated = { ...font, name: newName };
    await saveCustomFont(updated);
    setCustomFonts((prev) => prev.map((f) => (f.id === fontId ? updated : f)));
  };

  // Stamp Style handlers
  const selectedStamp = project.stamps.find((s) => s.id === selectedStampId);

  const activeStyleToEdit: StampStyle = selectedStamp ? selectedStamp.style : project.defaultStyle;

  const handleChangeStyle = (newStyle: StampStyle) => {
    if (selectedStampId) {
      // Modify selected stamp only
      handleUpdateStamp(selectedStampId, { style: newStyle });
    } else {
      // Modify default style for future stamps
      setProject((prev) => ({
        ...prev,
        defaultStyle: newStyle,
        updatedAt: Date.now(),
      }));
    }
  };

  const handleApplyStyleToAllStamps = () => {
    if (!selectedStamp) return;
    const styleToApply = selectedStamp.style;
    setProject((prev) => ({
      ...prev,
      stamps: prev.stamps.map((s) => ({ ...s, style: { ...styleToApply } })),
      defaultStyle: { ...styleToApply },
      updatedAt: Date.now(),
    }));
    showToast('Applied style to all existing stamps & set as default!');
  };

  const handleSetSelectedStyleAsDefault = () => {
    if (!selectedStamp) return;
    setProject((prev) => ({
      ...prev,
      defaultStyle: { ...selectedStamp.style },
      updatedAt: Date.now(),
    }));
    showToast('Saved as default style for upcoming stamps!');
  };

  const handleAddFavoriteColor = (color: string) => {
    if (project.favoriteColors.includes(color)) return;
    setProject((prev) => ({
      ...prev,
      favoriteColors: [color, ...prev.favoriteColors].slice(0, 10),
      updatedAt: Date.now(),
    }));
  };

  // Photos with stamp count metadata
  const photosWithCounts = project.photos.map((p) => ({
    ...p,
    stampsCount: project.stamps.filter((s) => s.photoId === p.id).length,
  }));

  const currentPhoto = photosWithCounts[currentPhotoIndex] || null;

  // Upcoming number preview text
  const currentPreviewText = formatStampNumber(
    project.numberingConfig.currentNumber,
    project.numberingConfig
  );

  return (
    <div className="flex flex-col w-full h-screen max-w-md mx-auto bg-slate-950 text-slate-100 select-none overflow-hidden relative shadow-2xl">
      {/* Hidden file picker input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleSelectPhotos}
        className="hidden"
      />

      {/* SCREEN 1: HOME SCREEN */}
      {screen === 'home' && (
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
          {/* Top Brand / Title */}
          <div className="pt-6 text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-400/20">
              #
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Sequential Photo Numberer
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Place consecutive number stamps across photos and multi-panel collages with one-tap precision.
            </p>
          </div>

          {/* Quick Resume If Photos Exist */}
          {project.photos.length > 0 && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Project</span>
                <span className="text-amber-400 font-bold">{project.photos.length} photos</span>
              </div>
              <div className="font-semibold text-sm text-white truncate">{project.name}</div>
              <button
                onClick={() => setScreen('editor')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Editing</span>
              </button>
            </div>
          )}

          {/* Core Home Actions */}
          <div className="space-y-3 pb-4">
            {/* Primary Action Button: Select Photos */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-400/15 flex items-center justify-center gap-3 transition-all"
            >
              <Images className="w-6 h-6" />
              <span>Select Photos</span>
            </button>

            {/* Instant Demo Collage Button */}
            <button
              onClick={handleLoadSampleCollage}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-850 active:scale-98 text-sky-400 font-bold text-xs rounded-2xl border border-sky-500/30 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Try Quad-Panel Collage Demo</span>
            </button>

            {/* Secondary Action: Open Saved Project */}
            <button
              onClick={() => setIsProjectsModalOpen(true)}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-slate-200 font-semibold text-xs rounded-2xl border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Open Saved Project</span>
            </button>

            {/* Secondary Action: Settings & Stamp Style */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedStampId(null);
                  setIsStylePanelOpen(true);
                }}
                className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl border border-slate-800 flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Stamp Style</span>
              </button>

              <button
                onClick={() => setIsTutorialOpen(true)}
                className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl border border-slate-800 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Tutorial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: IMPORT REVIEW & START NUMBERING SETUP */}
      {screen === 'import_review' && (
        <div className="flex-1 flex flex-col justify-between p-5 overflow-hidden">
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileImage className="w-5 h-5 text-amber-400" />
              <span>Review Imported Photos ({project.photos.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Drag or use arrows to rearrange order before numbering begins.
            </p>
          </div>

          {/* Scrollable Photos Grid */}
          <div className="flex-1 my-4 overflow-y-auto pr-1 space-y-2">
            {project.photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-2xl border border-slate-800"
              >
                <span className="font-mono text-xs font-bold text-amber-400 w-6 text-center">
                  #{idx + 1}
                </span>

                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{photo.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {photo.width} × {photo.height} px
                  </div>
                </div>

                {/* Reorder and Delete buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMovePhoto(idx, 'prev')}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMovePhoto(idx, 'next')}
                    disabled={idx === project.photos.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 rounded ml-1"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add More Photos</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsInitialSetupOpen(true)}
              className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>Configure & Start Numbering</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setScreen('home')}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3: FULL SCREEN EDITOR */}
      {screen === 'editor' && (
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          {project.photos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <FileImage className="w-8 h-8 text-amber-400/60" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">All Pages Deleted</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-5">
                All photos have been removed. Add new photos to start numbering or return home.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Photos</span>
                </button>
                <button
                  onClick={() => setScreen('home')}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 active:scale-95 transition-all"
                >
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Bar */}
              <TopBar
                projectName={project.name}
                currentPhotoIndex={currentPhotoIndex}
                totalPhotos={project.photos.length}
                currentPhotoStampsCount={currentPhoto?.stampsCount || 0}
                numberingConfig={project.numberingConfig}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                onBack={() => setScreen('home')}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onOpenSetup={() => setIsSetupModalOpen(true)}
                onOpenTutorial={() => setIsTutorialOpen(true)}
                onOpenRenumber={() => setIsRenumberModalOpen(true)}
                onOpenExport={() => setIsExportModalOpen(true)}
                onOpenProjects={() => setIsProjectsModalOpen(true)}
                onOpenPageManager={() => setIsPageManagerOpen(true)}
                onOpenBatchNumber={() => setIsBatchNumberModalOpen(true)}
                onDeleteCurrentPage={() => currentPhoto && promptDeletePhoto(currentPhoto.id)}
                onClearPageStamps={promptClearCurrentPageStamps}
                onDeleteAllPages={promptDeleteAllPages}
                onOpenAIAutoNumber={() => setIsAIModalOpen(true)}
              />

              {/* STEP 4: AI Manual Override Exception Banner */}
              {aiManualOverride && aiManualOverride.photoIndex === currentPhotoIndex && (
                <div className="bg-gradient-to-r from-purple-950/95 via-slate-900/95 to-amber-950/95 border-b border-amber-500/50 p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xl z-20 select-none animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <div>
                      <span className="font-bold text-amber-300">
                        Manual Placement Required for Collage #{aiManualOverride.photoIndex + 1}:
                      </span>
                      <span className="text-slate-200 ml-1">
                        Tap collage to place #{formatStampNumber(aiManualOverride.nextSequenceNumber + aiManualOverride.placedCoords.length * (project.numberingConfig.increment || 1), project.numberingConfig)}
                      </span>
                      <span className="text-amber-400 font-mono font-bold ml-1.5 bg-amber-400/20 px-1.5 py-0.5 rounded text-[10px]">
                        {aiManualOverride.placedCoords.length} placed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {aiManualOverride.placedCoords.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndoManualOverrideTap}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 active:scale-95 transition-all cursor-pointer"
                      >
                        Undo Tap
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleConfirmManualOverride}
                      disabled={aiManualOverride.placedCoords.length === 0}
                      className="py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      Confirm & Resume Auto-Numbering
                    </button>
                  </div>
                </div>
              )}

              {/* Main Zoomable & Pannable Canvas */}
              <div className="flex-1 w-full h-full relative overflow-hidden">
                <CanvasEditor
                  photo={currentPhoto}
                  stamps={project.stamps}
                  selectedStampId={selectedStampId}
                  mode={editorMode}
                  onSetMode={setEditorMode}
                  onPlaceStamp={handlePlaceStamp}
                  onSelectStamp={setSelectedStampId}
                  onUpdateStamp={handleUpdateStamp}
                  onDeleteStamp={handleDeleteStamp}
                  onDuplicateStamp={handleDuplicateStamp}
                  onOpenStyleForSelected={() => setIsStylePanelOpen(true)}
                  currentIndex={currentPhotoIndex}
                  totalPhotos={project.photos.length}
                  onNextPhoto={() => {
                    if (currentPhotoIndex < project.photos.length - 1) {
                      setCurrentPhotoIndex(currentPhotoIndex + 1);
                      setSelectedStampId(null);
                    }
                  }}
                  onPrevPhoto={() => {
                    if (currentPhotoIndex > 0) {
                      setCurrentPhotoIndex(currentPhotoIndex - 1);
                      setSelectedStampId(null);
                    }
                  }}
                  autoAdvance={autoAdvance}
                  onToggleAutoAdvance={() => setAutoAdvance((v) => !v)}
                  onNumberAllPhotosAtPosition={(normX, normY) => {
                    handleBatchNumberAllPhotos(normX, normY);
                    showToast(`Numbered all ${project.photos.length} photos sequentially!`);
                  }}
                  manualOverrideActive={Boolean(aiManualOverride && aiManualOverride.photoIndex === currentPhotoIndex)}
                  onManualOverrideTap={handleManualOverrideTap}
                />
              </div>

              {/* Photo Strip (Toggleable) */}
              {isPhotoStripOpen && (
                <PhotoStrip
                  photos={photosWithCounts}
                  currentIndex={currentPhotoIndex}
                  onSelectPhoto={(idx) => {
                    setCurrentPhotoIndex(idx);
                    setSelectedStampId(null);
                  }}
                  onAddPhotos={handleAddMorePhotos}
                  onDeletePhoto={promptDeletePhoto}
                  onMovePhoto={handleMovePhoto}
                  onOpenPageManager={() => setIsPageManagerOpen(true)}
                />
              )}

              {/* Bottom Navigation & Tools Toolbar */}
              <BottomToolbar
                currentIndex={currentPhotoIndex}
                totalPhotos={project.photos.length}
                selectedStamp={selectedStamp}
                currentPageStampsCount={project.stamps.filter((s) => s.photoId === currentPhoto?.id).length}
                onPrevPhoto={() => {
                  if (currentPhotoIndex > 0) {
                    setCurrentPhotoIndex(currentPhotoIndex - 1);
                    setSelectedStampId(null);
                  }
                }}
                onNextPhoto={() => {
                  if (currentPhotoIndex < project.photos.length - 1) {
                    setCurrentPhotoIndex(currentPhotoIndex + 1);
                    setSelectedStampId(null);
                  }
                }}
                onOpenStylePanel={() => setIsStylePanelOpen(true)}
                onTogglePhotoStrip={() => setIsPhotoStripOpen((v) => !v)}
                isPhotoStripOpen={isPhotoStripOpen}
                onOpenRenumber={() => setIsRenumberModalOpen(true)}
                onOpenExport={() => setIsExportModalOpen(true)}
                onOpenBatchNumber={() => setIsBatchNumberModalOpen(true)}
                onOpenAIAutoNumber={() => setIsAIModalOpen(true)}
                onDeleteCurrentPage={() => currentPhoto && promptDeletePhoto(currentPhoto.id)}
                onClearPageStamps={promptClearCurrentPageStamps}
                onDeleteAllPages={promptDeleteAllPages}
                onDeleteSelectedStamp={() => selectedStamp && handleDeleteStamp(selectedStamp.id)}
                onDuplicateSelectedStamp={() => selectedStamp && handleDuplicateStamp(selectedStamp.id)}
                onDeselectStamp={() => setSelectedStampId(null)}
              />
            </>
          )}
        </div>
      )}

      {/* POPUP & BOTTOM SHEET DIALOGS */}

      {/* 1. Setup / Sequence Modal (Configures start number, increment, prefix, padding) */}
      <SetupModal
        isOpen={isSetupModalOpen || isInitialSetupOpen}
        isInitialSetup={isInitialSetupOpen}
        onClose={() => {
          setIsSetupModalOpen(false);
          setIsInitialSetupOpen(false);
        }}
        config={project.numberingConfig}
        onSave={(newCfg) => {
          setProject((prev) => ({
            ...prev,
            numberingConfig: newCfg,
            updatedAt: Date.now(),
          }));
          if (isInitialSetupOpen) {
            setIsInitialSetupOpen(false);
            setScreen('editor');
          }
        }}
      />

      {/* 2. Stamp Style Bottom Sheet Panel */}
      <StylePanel
        isOpen={isStylePanelOpen}
        onClose={() => setIsStylePanelOpen(false)}
        style={activeStyleToEdit}
        onChangeStyle={handleChangeStyle}
        currentPreviewText={currentPreviewText}
        isEditingSelectedStamp={!!selectedStampId}
        onApplyToAll={handleApplyStyleToAllStamps}
        onSetAsDefault={handleSetSelectedStyleAsDefault}
        customFonts={customFonts}
        onImportFontFile={handleImportFontFile}
        onDeleteCustomFont={handleDeleteCustomFont}
        onRenameCustomFont={handleRenameCustomFont}
        recentColors={project.recentColors}
        favoriteColors={project.favoriteColors}
        onAddFavoriteColor={handleAddFavoriteColor}
      />

      {/* 3. Full-Resolution Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        photos={project.photos}
        stamps={project.stamps}
        projectName={project.name}
        onBatchNumberAllPhotos={() => handleBatchNumberAllPhotos()}
        onClearAllPages={promptDeleteAllPages}
      />

      {/* 4. Renumber All Stamps Modal */}
      <RenumberModal
        isOpen={isRenumberModalOpen}
        onClose={() => setIsRenumberModalOpen(false)}
        stamps={project.stamps}
        photos={project.photos}
        currentConfig={project.numberingConfig}
        onApplyRenumber={handleApplyRenumber}
      />

      {/* 5. Projects Modal (Open / Save As / Delete) */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        currentProjectId={project.id}
        onLoadProject={(p) => {
          setProject(p);
          setCurrentPhotoIndex(0);
          setSelectedStampId(null);
          setScreen('editor');
        }}
        onNewProject={() => {
          fileInputRef.current?.click();
        }}
      />

      {/* 6. Friendly Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* 7. Page Manager Modal (Manage, Grid, Delete Pages) */}
      <PageManagerModal
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        photos={project.photos}
        stamps={project.stamps}
        currentIndex={currentPhotoIndex}
        onSelectPhoto={(idx) => {
          setCurrentPhotoIndex(idx);
          setSelectedStampId(null);
        }}
        onDeletePhoto={promptDeletePhoto}
        onDeleteMultiplePhotos={handleDeleteMultiplePhotos}
        onDeleteAllPages={promptDeleteAllPages}
        onMovePhoto={handleMovePhoto}
        onAddPhotos={handleAddMorePhotos}
      />

      {/* 8. Batch Number Modal */}
      <BatchNumberModal
        isOpen={isBatchNumberModalOpen}
        onClose={() => setIsBatchNumberModalOpen(false)}
        totalPhotos={project.photos.length}
        config={project.numberingConfig}
        currentPhotoIndex={currentPhotoIndex}
        onApplyBatchNumber={(pos) => {
          handleBatchNumberAllPhotos(pos.x, pos.y);
          showToast(`Numbered all ${project.photos.length} pages at ${pos.name}!`);
        }}
      />

      {/* 9. AI Auto-Numbering Modal */}
      <AIAutoNumberModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        photos={project.photos}
        currentIndex={currentPhotoIndex}
        numberingConfig={project.numberingConfig}
        isRunning={isAIRunning}
        progress={aiProgress}
        onStartAutoNumber={handleStartAIAutoNumbering}
      />

      {/* 10. Universal In-App Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          confirmVariant={confirmModalConfig.confirmVariant}
          icon={confirmModalConfig.icon}
          previewImage={confirmModalConfig.previewImage}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}

      {/* 10. Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 text-amber-300 font-semibold text-xs rounded-full border border-amber-500/40 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
