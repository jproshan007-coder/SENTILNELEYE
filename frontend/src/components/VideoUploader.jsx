import React, { useState } from 'react';
import { X, UploadCloud, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadVideoFile } from '../services/api';

export default function VideoUploader({ onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetCam, setTargetCam] = useState('CAM-02');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a video file first');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const res = await uploadVideoFile(selectedFile, targetCam);
      if (res.status === 'success') {
        setSuccessMsg(`Video successfully assigned to ${targetCam}! Processing AI pipeline...`);
        setTimeout(() => {
          if (onUploadSuccess) onUploadSuccess(targetCam);
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Upload failed');
      }
    } catch (e) {
      setErrorMsg('Network error during video upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-lg glass-panel bg-[#0C101D] border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display font-bold text-lg text-white">Upload Video & Analyze AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          {/* Select Target Camera */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Target Camera Feed
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].map((cam) => (
                <button
                  key={cam}
                  type="button"
                  onClick={() => setTargetCam(cam)}
                  className={`p-2.5 rounded-xl border text-center transition font-bold ${
                    targetCam === cam
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cam}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Drop Area */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select CCTV Video File (MP4, AVI, MOV, WebM)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-900/40 rounded-2xl cursor-pointer transition p-4">
              <UploadCloud className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
              <p className="text-xs text-slate-300 font-mono text-center">
                {selectedFile ? selectedFile.name : 'Click to browse or drop video file here'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Supported formats: .mp4, .avi, .mov, .webm
              </p>
              <input
                type="file"
                accept="video/mp4,video/avi,video/quicktime,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Status Messages */}
          {errorMsg && (
            <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-950/50 p-3 rounded-xl border border-red-800/80 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/50 p-3 rounded-xl border border-emerald-800/80 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isUploading ? 'UPLOADING & ANALYZING...' : 'START AI ANALYSIS'}
          </button>
        </div>
      </div>
    </div>
  );
}
