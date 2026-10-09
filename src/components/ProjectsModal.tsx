import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { listProjects, getProject, saveProject, deleteProject } from '../utils/storage';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Clock,
  Image as ImageIcon,
  Hash,
  X,
  Edit2,
  Check,
  Download,
  Upload,
} from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  onLoadProject: (project: Project) => void;
  onNewProject: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  onLoadProject,
  onNewProject,
}) => {
  const [projectsList, setProjectsList] = useState<
    Array<{ id: string; name: string; updatedAt: number; photosCount: number; stampsCount: number }>
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  const loadList = async () => {
    try {
      const list = await listProjects();
      setProjectsList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpen = async (id: string) => {
    try {
      const p = await getProject(id);
      if (p) {
        onLoadProject(p);
        onClose();
      }
    } catch (e) {
      console.error('Failed to load project', e);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setConfirmDeleteId(null);
    loadList();
  };

  const handleDuplicate = async (id: string) => {
    const orig = await getProject(id);
    if (!orig) return;
    const newProj: Project = {
      ...orig,
      id: `proj_${Date.now()}`,
      name: `${orig.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveProject(newProj);
    loadList();
  };

  const handleRename = async (id: string) => {
    const orig = await getProject(id);
    if (!orig || !editName.trim()) return;
    orig.name = editName.trim();
    orig.updatedAt = Date.now();
    await saveProject(orig);
    setEditingId(null);
    loadList();
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Saved Projects</h3>
              <p className="text-[11px] text-slate-400">Locally saved on your device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* New Project Button */}
          <button
            onClick={() => {
              onNewProject();
              onClose();
            }}
            className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-400/10 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>

          {/* Project List */}
          <div className="space-y-2 pt-1">
            {projectsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                No saved projects found.
              </div>
            ) : (
              projectsList.map((item) => {
                const isCurrent = item.id === currentProjectId;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-slate-800/90 border-amber-400/60 ring-1 ring-amber-400/20'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white flex-1"
                          />
                          <button
                            onClick={() => handleRename(item.id)}
                            className="p-1 bg-amber-400 text-slate-950 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleOpen(item.id)}
                          className="font-bold text-xs text-white hover:text-amber-300 cursor-pointer truncate flex items-center gap-1.5"
                        >
                          <span className="truncate">{item.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditName(item.name);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(item.id)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 p-0.5 rounded-lg border border-rose-600/50">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 text-slate-300 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {item.photosCount} photos
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {item.stampsCount} stamps
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.updatedAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
