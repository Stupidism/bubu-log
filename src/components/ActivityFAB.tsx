'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, X, Moon, Sun, Milk, Baby, Target, Droplet, Mic, Keyboard, Send, Loader2, Check } from 'lucide-react'
import { ActivityType, ActivityTypeLabels } from '@/types/activity'
import { ActivityIcon } from './ActivityIcon'
import { useQueryClient } from '@tanstack/react-query'

// Parsed voice input data for confirmation
export interface VoiceParsedData {
  type: ActivityType
  recordTime: string
  duration: number | null
  milkAmount: number | null
  hasPoop: boolean | null
  hasPee: boolean | null
  poopColor: string | null
  peeAmount: string | null
  notes: string | null
  confidence: number
  originalText: string
}

interface ActivityFABProps {
  onActivitySelect: (type: ActivityType | 'wake') => void
  onDiaperSelect: (type: 'poop' | 'pee' | 'both') => void
  onVoiceInput?: () => void
  isSleeping?: boolean
  sleepLoading?: boolean
  isVoiceOpen?: boolean
  onVoiceClose?: () => void
  onVoiceSuccess?: (message: string) => void
  onVoiceError?: (message: string) => void
  onNeedConfirmation?: (parsed: VoiceParsedData) => void
}

interface VoiceInputResponse {
  success: boolean
  message: string
  needConfirmation?: boolean
  parsed?: VoiceParsedData
  activity?: {
    id: string
    type: string
  }
  error?: string
}

export function ActivityFAB({ 
  onActivitySelect, 
  onDiaperSelect,
  isSleeping = false,
  sleepLoading = false,
  isVoiceOpen = false,
  onVoiceClose,
  onVoiceSuccess,
  onVoiceError,
  onNeedConfirmation,
}: ActivityFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false)
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const queryClient = useQueryClient()

  // 检查是否支持语音识别
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
  }, [])

  // 同步外部状态
  useEffect(() => {
    if (isVoiceOpen !== undefined) {
      setVoiceDialogOpen(isVoiceOpen)
    }
  }, [isVoiceOpen])

  // 关闭语音面板时重置状态
  useEffect(() => {
    if (!voiceDialogOpen) {
      setText('')
      setResult(null)
      setMode('voice')
      setIsListening(false)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [voiceDialogOpen])

  // 关闭语音对话框
  const closeVoiceDialog = useCallback(() => {
    setVoiceDialogOpen(false)
    onVoiceClose?.()
  }, [onVoiceClose])

  const handleSelect = useCallback((type: ActivityType | 'wake') => {
    setIsOpen(false)
    onActivitySelect(type)
  }, [onActivitySelect])

  const handleDiaperSelect = useCallback((type: 'poop' | 'pee' | 'both') => {
    setIsOpen(false)
    onDiaperSelect(type)
  }, [onDiaperSelect])

  // 提交语音/文字输入
  const handleSubmit = useCallback(async (inputText?: string) => {
    const textToSubmit = inputText || text
    if (!textToSubmit.trim() || isLoading) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/voice-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSubmit.trim() }),
      })

      const data: VoiceInputResponse = await response.json()

      if (response.ok && data.success) {
        // Check if needs confirmation (low confidence)
        if (data.needConfirmation && data.parsed && onNeedConfirmation) {
          setResult({ type: 'success', message: data.message })
          setText('')
          // Close dialog and open form for confirmation
          setTimeout(() => {
            closeVoiceDialog()
            onNeedConfirmation(data.parsed!)
          }, 500)
        } else {
          // High confidence - activity was created directly
          setResult({ type: 'success', message: data.message })
          setText('')
          onVoiceSuccess?.(data.message)
          // 使用正确的 queryKey 格式刷新数据
          queryClient.invalidateQueries({ queryKey: ['get', '/activities'] })
          queryClient.invalidateQueries({ queryKey: ['get', '/activities/latest'] })
          // 1.5秒后关闭
          setTimeout(() => {
            closeVoiceDialog()
          }, 1500)
        }
      } else {
        const errorMsg = data.error || '解析失败'
        setResult({ type: 'error', message: errorMsg })
        onVoiceError?.(errorMsg)
      }
    } catch {
      const errorMsg = '网络错误，请重试'
      setResult({ type: 'error', message: errorMsg })
      onVoiceError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [text, isLoading, onVoiceSuccess, onVoiceError, closeVoiceDialog, queryClient, onNeedConfirmation])

  // 开始语音识别
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      // 浏览器不支持语音识别，切换到文字输入
      setMode('text')
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')
        
        setText(transcript)
        
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false)
          handleSubmit(transcript)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        // 只有权限相关错误才切换到文字输入
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setResult({ type: 'error', message: '麦克风权限被拒绝，请使用文字输入' })
          setMode('text')
          setTimeout(() => inputRef.current?.focus(), 100)
        } else if (event.error === 'no-speech') {
          // 没有检测到语音，不切换模式，让用户重试
          setResult({ type: 'error', message: '没有检测到语音，请重试' })
        } else if (event.error === 'network') {
          setResult({ type: 'error', message: '网络错误，请检查网络连接' })
        }
        // 其他错误（如 aborted）不显示消息
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      setResult({ type: 'error', message: '语音识别启动失败，请使用文字输入' })
      setMode('text')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [handleSubmit])

  // 停止语音识别
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <>
      {/* 遮罩层 - 活动选择 */}
      {isOpen && (
        <div 
          className="fab-overlay fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 遮罩层 - 语音输入 */}
      {voiceDialogOpen && (
        <div 
          className="fab-overlay fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
          onClick={closeVoiceDialog}
        />
      )}

      {/* 活动选择面板 */}
      {isOpen && (
        <div className="fab-modal fixed inset-x-0 bottom-24 z-50 px-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-4">
            {/* 睡眠区域 */}
            <section className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1 flex items-center gap-1">
                <Moon size={14} />
                睡眠
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelect(ActivityType.SLEEP)}
                  disabled={isSleeping || sleepLoading}
                  className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Moon size={24} />
                  <span className="font-medium">入睡</span>
                </button>
                <button
                  onClick={() => handleSelect('wake')}
                  disabled={sleepLoading}
                  className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 disabled:opacity-50"
                >
                  <Sun size={24} />
                  <span className="font-medium">睡醒</span>
                </button>
              </div>
            </section>

            {/* 喂奶区域 */}
            <section className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1 flex items-center gap-1">
                <Milk size={14} />
                喂奶
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelect(ActivityType.BREASTFEED)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                >
                  <ActivityIcon type={ActivityType.BREASTFEED} size={24} />
                  <span className="font-medium">{ActivityTypeLabels[ActivityType.BREASTFEED]}</span>
                </button>
                <button
                  onClick={() => handleSelect(ActivityType.BOTTLE)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  <ActivityIcon type={ActivityType.BOTTLE} size={24} />
                  <span className="font-medium">{ActivityTypeLabels[ActivityType.BOTTLE]}</span>
                </button>
              </div>
            </section>

            {/* 换尿布区域 */}
            <section className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1 flex items-center gap-1">
                <Baby size={14} />
                换尿布
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleDiaperSelect('poop')}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                >
                  <span className="text-xl">💩</span>
                  <span className="text-sm font-medium">大便</span>
                </button>
                <button
                  onClick={() => handleDiaperSelect('pee')}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                >
                  <Droplet size={24} />
                  <span className="text-sm font-medium">小便</span>
                </button>
                <button
                  onClick={() => handleDiaperSelect('both')}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                >
                  <span className="text-xl">💩💧</span>
                  <span className="text-sm font-medium">大小便</span>
                </button>
              </div>
            </section>

            {/* 其他活动区域 */}
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1 flex items-center gap-1">
                <Target size={14} />
                其他活动
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ActivityType.HEAD_LIFT,
                  ActivityType.PASSIVE_EXERCISE,
                  ActivityType.GAS_EXERCISE,
                  ActivityType.BATH,
                  ActivityType.OUTDOOR,
                  ActivityType.EARLY_EDUCATION,
                ].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSelect(type)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                  >
                    <ActivityIcon type={type} size={22} />
                    <span className="text-xs font-medium text-center leading-tight">
                      {ActivityTypeLabels[type]}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 语音输入对话框 */}
      {voiceDialogOpen && (
        <div className="fab-modal fixed inset-x-0 bottom-24 z-50 px-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-5 max-w-sm mx-auto">
            {/* 标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Mic size={20} className="text-violet-500" />
                语音记录
              </h3>
              <button
                onClick={closeVoiceDialog}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* 结果提示 */}
            {result && (
              <div
                className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
                  result.type === 'success'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
              >
                {result.type === 'success' ? (
                  <Check size={18} className="flex-shrink-0" />
                ) : (
                  <X size={18} className="flex-shrink-0" />
                )}
                <span className="font-medium">{result.message}</span>
              </div>
            )}

            {/* 语音模式 */}
            {mode === 'voice' ? (
              <div className="text-center">
                {/* 识别中的文字 */}
                {isListening && text && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 animate-pulse">
                    {text}
                  </div>
                )}

                {/* 语音按钮 */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  {isLoading ? (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Loader2 size={36} className="text-white animate-spin" />
                    </div>
                  ) : isListening ? (
                    <button
                      onClick={stopListening}
                      className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-pulse"
                    >
                      <div className="w-8 h-8 bg-white rounded-sm" />
                    </button>
                  ) : (
                    <button
                      onClick={startListening}
                      disabled={!speechSupported}
                      className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${
                        speechSupported
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Mic size={36} className="text-white" />
                    </button>
                  )}
                </div>

                {/* 提示文字 */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {isListening ? '正在听...' : speechSupported ? '点击麦克风开始说话' : '此浏览器不支持语音'}
                </p>

                {/* 切换到键盘 */}
                <button
                  onClick={() => {
                    setMode('text')
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }}
                  className="text-sm text-violet-600 dark:text-violet-400 flex items-center gap-1 mx-auto"
                >
                  <Keyboard size={16} />
                  切换到键盘输入
                </button>
              </div>
            ) : (
              /* 文字输入模式 */
              <div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 mb-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="说说宝宝做了什么..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400 text-base"
                  />
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!text.trim() || isLoading}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      !text.trim() || isLoading
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-400'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>

                {/* 切换到语音 */}
                {speechSupported && (
                  <button
                    onClick={() => setMode('voice')}
                    className="text-sm text-violet-600 dark:text-violet-400 flex items-center gap-1 mx-auto"
                  >
                    <Mic size={16} />
                    切换到语音输入
                  </button>
                )}
              </div>
            )}

            {/* 示例提示 */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                试试说: "喝了80毫升奶" "换尿布有便便" "睡了一个小时"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 语音输入按钮 - 在 FAB 左边 */}
      {!isOpen && (
        <button
          onClick={() => {
            if (voiceDialogOpen) {
              closeVoiceDialog()
            } else {
              setVoiceDialogOpen(true)
            }
          }}
          className={`fab-voice-button fixed right-20 bottom-24 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            voiceDialogOpen
              ? 'bg-violet-500 scale-110'
              : 'bg-white dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-gray-200 dark:border-gray-700'
          }`}
          aria-label="语音输入"
        >
          <Mic size={22} className={voiceDialogOpen ? 'text-white' : 'text-violet-500'} />
        </button>
      )}

      {/* FAB 按钮 */}
      <button
        onClick={() => {
          if (voiceDialogOpen) {
            closeVoiceDialog()
          }
          setIsOpen(!isOpen)
        }}
        className={`fab-button fixed right-4 bottom-24 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? 'bg-gray-600 rotate-45'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:shadow-xl hover:scale-105 active:scale-95'
        }`}
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <Plus size={28} className="text-white" />
        )}
      </button>
    </>
  )
}

