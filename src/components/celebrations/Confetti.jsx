import React, { useEffect, useState } from 'react'
import './Confetti.css'

const CONFETTI_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#95E1D3', // Mint
    '#F38181', // Coral
    '#AA96DA', // Purple
    '#FCBAD3', // Pink
    '#A8D8EA', // Light Blue
    '#00D9FF', // Cyan (accent)
    '#FFD93D', // Gold
]

const CONFETTI_SHAPES = ['square', 'circle', 'triangle']

function ConfettiPiece({ delay, duration, left, color, shape, size }) {
    return (
        <div
            className={`confetti-piece confetti-${shape}`}
            style={{
                '--delay': `${delay}ms`,
                '--duration': `${duration}ms`,
                '--left': `${left}%`,
                '--size': `${size}px`,
                backgroundColor: shape !== 'triangle' ? color : 'transparent',
                borderBottomColor: shape === 'triangle' ? color : 'transparent',
            }}
        />
    )
}

export default function Confetti({
    active = false,
    duration = 3000,
    pieceCount = 100,
    onComplete
}) {
    const [pieces, setPieces] = useState([])
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (active) {
            // Generate confetti pieces
            const newPieces = Array.from({ length: pieceCount }, (_, i) => ({
                id: i,
                delay: Math.random() * 500,
                duration: 2000 + Math.random() * 1500,
                left: Math.random() * 100,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
                size: 8 + Math.random() * 8,
            }))

            setPieces(newPieces)
            setVisible(true)

            // Clean up after animation
            const timer = setTimeout(() => {
                setVisible(false)
                setPieces([])
                onComplete?.()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [active, duration, pieceCount, onComplete])

    if (!visible) return null

    return (
        <div className="confetti-container" aria-hidden="true">
            {pieces.map(piece => (
                <ConfettiPiece key={piece.id} {...piece} />
            ))}
        </div>
    )
}

// Hook for easy confetti triggering
export function useConfetti() {
    const [showConfetti, setShowConfetti] = useState(false)

    const triggerConfetti = () => {
        setShowConfetti(true)
    }

    const handleComplete = () => {
        setShowConfetti(false)
    }

    return {
        showConfetti,
        triggerConfetti,
        ConfettiComponent: () => (
            <Confetti active={showConfetti} onComplete={handleComplete} />
        )
    }
}
