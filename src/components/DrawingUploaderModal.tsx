import React, { useState } from 'react';
import type { PhotoEntry } from '../types/contest.ts';
import { Upload, X, Check, Image as ImageIcon, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { compressImageFile } from '../utils/imageOptimizer.ts';

interface DrawingUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoEntry[];
  onUpdatePhoto: (id: string, updates: Partial<PhotoEntry>) => Promise<{ success: boolean }>;
}

export const DrawingUploaderModal: React.FC<DrawingUploaderModalProps> = ({
  isOpen,
  onClose,
  photos,
  onUpdatePhoto,
}) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (photoId: string, file: File) => {
    if (!file) return;

    setUploadingId(photoId);
    try {
      const optimizedBase64 = await compressImageFile(file, 1200, 0.85);
      if (optimizedBase64) {
        await onUpdatePhoto(photoId, { imageUrl: optimizedBase64 });
        setSuccessMsg(`Imagem da obra otimizada e salva com sucesso!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (e) {
      console.error('Error compressing image:', e);
    } finally {
      setUploadingId(null);
    }
  };

  const handleBulkUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const name = file.name.toLowerCase();
      let matchedId = '';

      if (name.includes('01') || name.includes('1')) matchedId = 'desenho-1';
      else if (name.includes('02') || name.includes('2')) matchedId = 'desenho-2';
      else if (name.includes('03') || name.includes('3')) matchedId = 'desenho-3';
      else if (name.includes('04') || name.includes('4')) matchedId = 'desenho-4';
      else if (name.includes('05') || name.includes('5')) matchedId = 'desenho-5';

      if (matchedId) {
        handleFileSelect(matchedId, file);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Upload className="w-6 h-6 text-amber-400" />
              Carregar Arquivos das 5 Obras Originais
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Selecione ou solte os arquivos <strong className="text-slate-200">01.jpeg, 02.jpeg, 03.jpeg, 04.jpeg, 05.jpeg</strong> para exibi-los no concurso.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="my-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {/* Bulk Dropzone */}
        <div className="my-4 p-5 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 text-center hover:bg-amber-500/10 transition-colors relative cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleBulkUpload(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-white">
            Solte aqui os 5 arquivos de uma vez só (01.jpeg a 05.jpeg)
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Ou clique para selecionar múltiplos arquivos do seu computador ou celular.
          </div>
        </div>

        {/* 5 Slots List */}
        <div className="flex-1 overflow-y-auto space-y-3 my-2 pr-1 max-h-[46vh]">
          {photos.map((photo, index) => {
            const isUploading = uploadingId === photo.id;
            const fileHint = `0${index + 1}.jpeg`;

            return (
              <div
                key={photo.id}
                className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                        {fileHint}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 truncate">
                        {photo.category}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-white truncate mt-0.5">{photo.title}</div>
                    <div className="text-xs text-slate-400 truncate">Autor: {photo.photographer}</div>
                  </div>
                </div>

                <div className="relative shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    id={`file-input-${photo.id}`}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(photo.id, e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor={`file-input-${photo.id}`}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      isUploading
                        ? 'bg-slate-800 text-slate-400 cursor-wait'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                    }`}
                  >
                    {isUploading ? (
                      'Carregando...'
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Carregar {fileHint}
                      </>
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
