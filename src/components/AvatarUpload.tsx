'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Baby, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  onAvatarChange?: (avatarUrl: string | null) => void
}

interface BabyProfile {
  id: string
  name: string | null
  avatarUrl: string | null
  birthDate: string | null
}

export function AvatarUpload({ onAvatarChange }: AvatarUploadProps) {
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从数据库加载头像
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/baby-profile')
        if (res.ok) {
          const profile: BabyProfile = await res.json()
          if (profile.avatarUrl) {
            setAvatar(profile.avatarUrl)
            onAvatarChange?.(profile.avatarUrl)
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [onAvatarChange])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/baby-profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await res.json()
      setAvatar(data.url)
      onAvatarChange?.(data.url)
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
      // 清空 file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAvatar = async () => {
    if (isDeleting) return
    setIsDeleting(true)

    try {
      const res = await fetch('/api/baby-profile/avatar', {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Delete failed')
      }

      setAvatar(null)
      onAvatarChange?.(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to delete avatar:', error)
      alert('删除失败，请重试')
    } finally {
      setIsDeleting(false)
    }
  }

  const triggerFileInput = () => {
    if (!isUploading && !isDeleting) {
      fileInputRef.current?.click()
    }
  }

  if (isLoading) {
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-3 border-white shadow-lg flex items-center justify-center">
        <Loader2 size={24} className="text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || isDeleting}
      />

      {avatar ? (
        <div className="relative group">
          <div 
            className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg cursor-pointer"
            onClick={triggerFileInput}
          >
            {isUploading ? (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : (
              <img
                src={avatar}
                alt="宝宝头像"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeAvatar()
            }}
            disabled={isDeleting}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="删除头像"
          >
            {isDeleting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
          </button>
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md disabled:opacity-50"
            title="更换头像"
          >
            {isUploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={triggerFileInput}
          disabled={isUploading}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 border-3 border-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {isUploading ? (
            <Loader2 size={24} className="text-primary animate-spin" />
          ) : (
            <div className="text-center">
              <Baby size={24} className="text-primary mx-auto" />
              <Camera size={12} className="text-primary/60 mx-auto mt-0.5" />
            </div>
          )}
        </button>
      )}
    </div>
  )
}
