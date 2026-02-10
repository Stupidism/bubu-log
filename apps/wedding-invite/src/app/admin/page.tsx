"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ImageIcon,
  Users,
  Upload,
  Trash2,
  Search,
  Download,
  LogOut,
  CheckCircle,
  XCircle,
  HelpCircle,
  Menu,
  X,
  User,
  Calendar,
  Heart,
  ChevronRight,
} from "lucide-react";

// ==================== Types ====================

interface Photo {
  id: string;
  url: string;
  name: string;
  category?: string;
  uploadedAt: Date;
}

interface RSVPResponse {
  id: string;
  name: string;
  guestCount: number;
  phone: string;
  message: string;
  status: "attending" | "not_attending" | "pending";
  submittedAt: Date;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName: string;
}

// ==================== Mock Data ====================

const MOCK_PHOTOS: Photo[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop",
    name: "wedding_photo_01.jpg",
    category: "ceremony",
    uploadedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop",
    name: "wedding_photo_02.jpg",
    category: "reception",
    uploadedAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=400&fit=crop",
    name: "wedding_photo_03.jpg",
    category: "portrait",
    uploadedAt: new Date("2024-01-16"),
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop",
    name: "wedding_photo_04.jpg",
    category: "ceremony",
    uploadedAt: new Date("2024-01-16"),
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&h=400&fit=crop",
    name: "wedding_photo_05.jpg",
    category: "reception",
    uploadedAt: new Date("2024-01-17"),
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop",
    name: "wedding_photo_06.jpg",
    category: "details",
    uploadedAt: new Date("2024-01-17"),
  },
];

const MOCK_RSVP: RSVPResponse[] = [
  {
    id: "1",
    name: "张伟 & 李娜",
    guestCount: 2,
    phone: "138****8888",
    message: "恭喜新人，百年好合！",
    status: "attending",
    submittedAt: new Date("2024-01-10"),
  },
  {
    id: "2",
    name: "王芳",
    guestCount: 1,
    phone: "139****6666",
    message: "祝你们幸福美满！",
    status: "attending",
    submittedAt: new Date("2024-01-11"),
  },
  {
    id: "3",
    name: "刘明",
    guestCount: 3,
    phone: "137****9999",
    message: "很遗憾不能参加，祝新婚快乐！",
    status: "not_attending",
    submittedAt: new Date("2024-01-12"),
  },
  {
    id: "4",
    name: "陈静 & 家属",
    guestCount: 4,
    phone: "136****7777",
    message: "期待见证你们的幸福时刻！",
    status: "attending",
    submittedAt: new Date("2024-01-13"),
  },
  {
    id: "5",
    name: "赵强",
    guestCount: 1,
    phone: "135****5555",
    message: "",
    status: "pending",
    submittedAt: new Date("2024-01-14"),
  },
  {
    id: "6",
    name: "孙丽",
    guestCount: 2,
    phone: "134****4444",
    message: "一定会准时参加！",
    status: "attending",
    submittedAt: new Date("2024-01-15"),
  },
  {
    id: "7",
    name: "周杰",
    guestCount: 1,
    phone: "133****3333",
    message: "",
    status: "not_attending",
    submittedAt: new Date("2024-01-16"),
  },
];

// ==================== Animation Variants ====================

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// ==================== Components ====================

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-4xl font-bold"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {title}
              </p>
              <AnimatedCounter value={value} />
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PhotoUploadArea({
  onUpload,
  uploadState,
}: {
  onUpload: (files: FileList) => void;
  uploadState: UploadState;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUpload(e.target.files);
      }
    },
    [onUpload]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${
            isDragging
              ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <motion.div
          animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <Upload className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
              拖拽照片到此处上传
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              或点击选择文件，支持 JPG、PNG 格式
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {uploadState.isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                正在上传: {uploadState.fileName}
              </span>
              <span className="text-sm text-slate-500">{uploadState.progress}%</span>
            </div>
            <Progress value={uploadState.progress} className="h-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PhotoGrid({
  photos,
  onDelete,
}: {
  photos: Photo[];
  onDelete: (id: string) => void;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  const handleDeleteClick = (photo: Photo) => {
    setPhotoToDelete(photo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (photoToDelete) {
      onDelete(photoToDelete.id);
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    }
  };

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs truncate">{photo.name}</p>
                  {photo.category && (
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs bg-white/20 text-white border-0"
                    >
                      {photo.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(photo);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除照片 &quot;{photoToDelete?.name}&quot; 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RSVPTable({
  responses,
  searchQuery,
}: {
  responses: RSVPResponse[];
  searchQuery: string;
}) {
  const filteredResponses = responses.filter(
    (response) =>
      response.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.phone.includes(searchQuery) ||
      response.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: RSVPResponse["status"]) => {
    switch (status) {
      case "attending":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            参加
          </Badge>
        );
      case "not_attending":
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100">
            <XCircle className="w-3 h-3 mr-1" />
            不参加
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
            <HelpCircle className="w-3 h-3 mr-1" />
            待定
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
            <TableRow>
              <TableHead className="w-[150px]">姓名</TableHead>
              <TableHead className="w-[100px]">参加人数</TableHead>
              <TableHead className="w-[150px]">联系电话</TableHead>
              <TableHead>祝福语</TableHead>
              <TableHead className="w-[120px]">状态</TableHead>
              <TableHead className="w-[150px]">提交时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredResponses.map((response, index) => (
                <motion.tr
                  key={response.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <TableCell className="font-medium">{response.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      {response.guestCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {response.phone}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                    {response.message || "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(response.status)}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {response.submittedAt.toLocaleDateString("zh-CN")}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

// ==================== Main Admin Page ====================

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rsvpResponses, setRsvpResponses] = useState<RSVPResponse[]>([]);
  const [activeTab, setActiveTab] = useState("photos");
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch RSVP data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/rsvp");
        if (response.ok) {
          const data = await response.json();
          setRsvpResponses(data.map((r: { submittedAt: string }) => ({
            ...r,
            submittedAt: new Date(r.submittedAt),
          })));
        }
      } catch (error) {
        console.error("Failed to fetch RSVP data:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Statistics
  const stats = {
    total: rsvpResponses.length,
    attending: rsvpResponses.filter((r) => r.status === "attending").length,
    notAttending: rsvpResponses.filter((r) => r.status === "not_attending")
      .length,
    pending: rsvpResponses.filter((r) => r.status === "pending").length,
    totalGuests: rsvpResponses
      .filter((r) => r.status === "attending")
      .reduce((sum, r) => sum + r.guestCount, 0),
  };

  // Handlers
  const handleUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setUploadState({
      isUploading: true,
      progress: 0,
      fileName: file.name,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newPhoto: Photo = {
          id: Date.now().toString(),
          url: result.data.url,
          name: file.name,
          uploadedAt: new Date(),
        };
        setPhotos((prev) => [newPhoto, ...prev]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }

    setUploadState({
      isUploading: false,
      progress: 0,
      fileName: "",
    });
  }, []);

  const handleDeletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleExport = useCallback(() => {
    const csvContent = [
      ["姓名", "参加人数", "联系电话", "祝福语", "状态", "提交时间"],
      ...rsvpResponses.map((r) => [
        r.name,
        r.guestCount.toString(),
        r.phone,
        r.message,
        r.status === "attending"
          ? "参加"
          : r.status === "not_attending"
          ? "不参加"
          : "待定",
        r.submittedAt.toLocaleDateString("zh-CN"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `RSVP列表_${new Date().toLocaleDateString("zh-CN")}.csv`;
    link.click();
  }, [rsvpResponses]);

  const handleLogout = useCallback(() => {
    // Handle logout logic
    window.location.href = "/";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: sidebarOpen ? 240 : 70 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap"
                  >
                    婚礼管理
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <button
              onClick={() => setActiveTab("photos")}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  activeTab === "photos"
                    ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `}
            >
              <ImageIcon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    照片管理
                  </motion.span>
                )}
              </AnimatePresence>
              {activeTab === "photos" && sidebarOpen && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("rsvp")}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  activeTab === "rsvp"
                    ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    RSVP列表
                  </motion.span>
                )}
              </AnimatePresence>
              {activeTab === "rsvp" && sidebarOpen && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>
          </nav>

          {/* Sidebar Toggle */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full justify-center"
            >
              {sidebarOpen ? (
                <Menu className="w-5 h-5 rotate-180" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            婚礼管理后台
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <User className="w-4 h-4 text-rose-500" />
              </div>
              <span className="hidden sm:inline">管理员</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 dark:text-slate-400 hover:text-rose-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === "photos" ? (
              <motion.div
                key="photos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    照片管理
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    管理婚礼照片，支持拖拽上传
                  </p>
                </div>

                <PhotoUploadArea onUpload={handleUpload} uploadState={uploadState} />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                    已上传照片 ({photos.length})
                  </h3>
                </div>

                <PhotoGrid photos={photos} onDelete={handleDeletePhoto} />
              </motion.div>
            ) : (
              <motion.div
                key="rsvp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    RSVP列表
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    查看宾客回复统计和详细信息
                  </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    title="总回复数"
                    value={stats.total}
                    icon={Users}
                    color="bg-blue-500"
                    delay={0}
                  />
                  <StatCard
                    title="确认参加"
                    value={stats.attending}
                    icon={CheckCircle}
                    color="bg-emerald-500"
                    delay={0.1}
                  />
                  <StatCard
                    title="不参加"
                    value={stats.notAttending}
                    icon={XCircle}
                    color="bg-rose-500"
                    delay={0.2}
                  />
                  <StatCard
                    title="待定"
                    value={stats.pending}
                    icon={HelpCircle}
                    color="bg-amber-500"
                    delay={0.3}
                  />
                </div>

                {/* Additional Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <Card className="bg-gradient-to-r from-rose-500 to-pink-500 border-0 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-rose-100 text-sm mb-1">预计参加总人数</p>
                          <p className="text-4xl font-bold">{stats.totalGuests}</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <Calendar className="w-7 h-7" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Search and Export */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="搜索姓名、电话或祝福语..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出CSV
                  </Button>
                </div>

                {/* RSVP Table */}
                <RSVPTable responses={rsvpResponses} searchQuery={searchQuery} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
