'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { RefreshCw } from 'lucide-react'

const QRPage = () => {
  const [qrValue, setQrValue] = useState('')
  const [timeLeft, setTimeLeft] = useState(10)
  const [isExpired, setIsExpired] = useState(false)

  const generateQR = () => {
    setQrValue(`coffee-${Date.now()}`)
    setTimeLeft(10)
    setIsExpired(false)
  }

  useEffect(() => {
    generateQR()
  }, [])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsExpired(true)
    }
  }, [timeLeft])

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">QR Code</h2>
      <div className="bg-background p-6 rounded-lg shadow-md flex flex-col items-center">
        {isExpired ? (
          <div className="text-center">
            <p className="text-xl mb-4">QR code expired</p>
            <button 
              onClick={generateQR}
              className="bg-primary text-background px-4 py-2 rounded flex items-center"
            >
              <RefreshCw size={18} className="mr-2" />
              Regenerate QR
            </button>
          </div>
        ) : (
          <>
            <QRCode value={qrValue} size={200} />
            <p className="mt-4 text-lg font-semibold">Time remaining: {timeLeft}s</p>
          </>
        )}
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Purchase History</h3>
        <div className="space-y-4">
          <div className="bg-background p-4 rounded-lg shadow-md">
            <p className="font-semibold">Brew Haven</p>
            <p className="text-sm text-gray-600">June 15, 2023 - 2:30 PM</p>
            <p className="text-sm">Espresso (1)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRPage

