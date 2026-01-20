'use client'

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
    slider: 'accent-pink-500',
    minus: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    plus: 'bg-pink-200 dark:bg-pink-800/30 text-pink-800 dark:text-pink-200',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    slider: 'accent-blue-500',
    minus: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    plus: 'bg-blue-200 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    slider: 'accent-amber-500',
    minus: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    plus: 'bg-amber-200 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    value: 'text-gray-700 dark:text-gray-300',
    slider: 'accent-gray-500',
    minus: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    plus: 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200',
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value))
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
    <div className={`${styles.bg} rounded-2xl p-4`}>
      {label && (
        <p className={`text-base font-medium ${styles.text} mb-3 text-center`}>
          {label}
        </p>
      )}

      {/* 数值显示 */}
      <div className="text-center mb-3">
        <span className={`text-4xl font-bold ${styles.value}`}>
          {value}
        </span>
        <span className={`text-xl ${styles.text} ml-2`}>{unit}</span>
      </div>

      {/* 滑块 */}
      <div className="px-2 mb-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className={`w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer ${styles.slider}
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-7
            [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-current
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-7
            [&::-moz-range-thumb]:h-7
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-current
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer`}
        />
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1 px-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      {/* 微调按钮 */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => handleAdjust(-largeStep)}
          disabled={value <= min}
          className={`px-3 py-2 rounded-xl text-base font-semibold transition-all ${styles.minus} disabled:opacity-50`}
        >
          -{largeStep}{unit}
        </button>
        <button
          onClick={() => handleAdjust(-smallStep)}
          disabled={value <= min}
          className={`px-3 py-2 rounded-xl text-base font-semibold transition-all ${styles.minus} disabled:opacity-50`}
        >
          -{smallStep}{unit}
        </button>
        <button
          onClick={() => handleAdjust(smallStep)}
          disabled={!allowExceedMax && value >= max}
          className={`px-3 py-2 rounded-xl text-base font-semibold transition-all ${styles.plus} disabled:opacity-50`}
        >
          +{smallStep}{unit}
        </button>
        <button
          onClick={() => handleAdjust(largeStep)}
          disabled={!allowExceedMax && value >= max}
          className={`px-3 py-2 rounded-xl text-base font-semibold transition-all ${styles.plus} disabled:opacity-50`}
        >
          +{largeStep}{unit}
        </button>
      </div>
    </div>
  )
}

