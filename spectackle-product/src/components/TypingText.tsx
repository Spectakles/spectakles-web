import { useEffect, useState } from "react";
import "./TypingText.css";

interface TypingTextProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  cursorChar?: string;
  className?: string;
  cursorClassName?: string;
  loop?: boolean;
}

export default function TypingText({
  words,
  typingSpeed = 75,
  deletingSpeed = 40,
  pauseTime = 2000,
  cursorChar = "|",
  className = "",
  cursorClassName = "",
  loop = true,
}: TypingTextProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentTargetWord = words[wordIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Typing phase
      if (displayedText.length < currentTargetWord.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetWord.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing word, pause before deleting
        if (loop || wordIndex < words.length - 1) {
          timer = setTimeout(() => {
            setIsDeleting(true);
          }, pauseTime);
        }
      }
    } else {
      // Deleting phase
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentTargetWord.slice(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        // Finished deleting, transition to next word
        setIsDeleting(false);
        setWordIndex((prevIndex) => (prevIndex + 1) % words.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime, loop]);

  if (!words || words.length === 0) return null;

  return (
    <span className={`typing-text-wrapper ${className}`} aria-label={words[wordIndex]}>
      <span className="typing-text-content">{displayedText}</span>
      <span className={`typing-text-cursor ${cursorClassName}`} aria-hidden="true">
        {cursorChar}
      </span>
    </span>
  );
}
