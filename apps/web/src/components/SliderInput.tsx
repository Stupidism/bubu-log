'use client'

import { Slider, Button, cn } from '@bubu-log/ui'

interface SliderInputProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit: string
  label?: string
  color?: 'pink' | 'blue' | 'amber' | 'gray'
  /** 允许 + 按钮突破最大值限制 */
  allowExceedMax?: boolean
}

const colorStyles = {
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400',
    value: 'text-pink-700 dark:text-pink-300',
    track: '[&_[data-slot=slider-range]]:bg-pink-500',
    minus: 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300',
    plus: 'bg-pink-200 hover:bg-pink-300 dark:bg-pink-800/30 dark:hover:bg-pink-800/50 text-pink-800 dark:text-pink-200',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    track: '[&_[data-slot=slider-range]]:bg-blue-500',
    minus: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    plus: 'bg-blue-200 hover:bg-blue-300 dark:bg-blue-800/30 dark:hover:bg-blue-800/50 text-blue-800 dark:text-blue-200',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    track: '[&_[data-slot=slider-range]]:bg-amber-500',
    minus: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    plus: 'bg-amber-200 hover:bg-amber-300 dark:bg-amber-800/30 dark:hover:bg-amber-800/50 text-amber-800 dark:text-amber-200',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-700 dark:text-gray-300',
    track: '[&_[data-slot=slider-range]]:bg-gray-500',
    minus: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
    plus: 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200',
  },
}

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
  unit,
  label,
  color = 'gray',
  allowExceedMax = false,
}: SliderInputProps) {
  const styles = colorStyles[color]

  const handleSliderChange = (values: number[]) => {
    onChange(values[0])
  }

  const handleAdjust = (amount: number) => {
    let newValue = value + amount
    // 始终不能低于 min
    newValue = Math.max(min, newValue)
    // 如果不允许突破 max，则限制最大值
    if (!allowExceedMax) {
      newValue = Math.min(max, newValue)
    }
    onChange(newValue)
  }

  // 计算微调按钮的调整量
  const smallStep = step
  const largeStep = step * 5

  return (
    <div className={cn(styles.bg, 'rounded-2xl p-4')}>
      {label && (
        <p className={cn('text-base font-medium mb-3 text-center', styles.text)}>
          {label}
        </p>
      )}

      {/* 数值显示 */}
      <div className="text-center mb-3">
        <span className={cn('text-4xl font-bold', styles.value)}>
          {value}
        </span>
        <span className={cn('text-xl ml-2', styles.text)}>{unit}</span>
      </div>

      {/* 滑块 */}
      <div className="px-2 mb-3">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          className={cn('h-3', styles.track)}
        />
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1 px-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      {/* 微调按钮 */}
      <div className="flex justify-center gap-2">
        <Button
          variant="ghost"
          onClick={() => handleAdjust(-largeStep)}
          disabled={value <= min}
          className={cn('px-3 py-2 rounded-xl text-base font-semibold h-auto', styles.minus)}
        >
          -{largeStep}{unit}
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleAdjust(-smallStep)}
          disabled={value <= min}
          className={cn('px-3 py-2 rounded-xl text-base font-semibold h-auto', styles.minus)}
        >
          -{smallStep}{unit}
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleAdjust(smallStep)}
          disabled={!allowExceedMax && value >= max}
          className={cn('px-3 py-2 rounded-xl text-base font-semibold h-auto', styles.plus)}
        >
          +{smallStep}{unit}
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleAdjust(largeStep)}
          disabled={!allowExceedMax && value >= max}
          className={cn('px-3 py-2 rounded-xl text-base font-semibold h-auto', styles.plus)}
        >
          +{largeStep}{unit}
        </Button>
      </div>
    </div>
  )
}
