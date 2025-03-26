import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
    text: string;
    speed?: number;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 100 }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let index = 0;

        const interval = setInterval(() => {
            setDisplayedText((prev) => prev + text[index]);
            index++;

            if (index >= text.length) {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <p className="text-2xl font-mono text-white">{displayedText}</p>
    );
};

export default TypingEffect;
