import { motion } from 'framer-motion'

export default function MobileReportsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i, idx) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: idx * 0.08 }}
          className="h-16 rounded-2xl bg-gradient-to-r from-amber-100/50 via-amber-50 to-amber-100/50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800"
        />
      ))}
    </div>
  )
}

