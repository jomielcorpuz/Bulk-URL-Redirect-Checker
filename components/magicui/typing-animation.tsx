"use client";

import React, { useState, useEffect, memo } from "react";
import { AuroraText } from "./aurora-text";

interface TypingAnimationProps {
  words: string[];
  className?: string;
  colors?: string[];
  speed?: number;
  typingSpeed?: number;
  pauseDuration?: number;
}

export const TypingAnimation = memo(
  ({
    words,
    className = "",
    colors = ["#8206D4", "#FF0000", "#FCB045", "#FCB045"],
    speed = 1,
    typingSpeed = 150,
    pauseDuration = 2000,
  }: TypingAnimationProps) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
      const currentWord = words[currentWordIndex];
      let timeout: NodeJS.Timeout;

      if (isTyping && !isDeleting) {
        if (currentText.length < currentWord.length) {
          timeout = setTimeout(() => {
            setCurrentText(currentWord.slice(0, currentText.length + 1));
          }, typingSpeed);
        } else {
          timeout = setTimeout(() => {
            setIsTyping(false);
            setIsDeleting(true);
          }, pauseDuration);
        }
      } else if (isDeleting) {
        if (currentText.length > 0) {
          timeout = setTimeout(() => {
            setCurrentText(currentText.slice(0, -1));
          }, typingSpeed / 2);
        } else {
          setIsDeleting(false);
          setIsTyping(true);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }

      return () => clearTimeout(timeout);
    }, [currentText, currentWordIndex, isTyping, isDeleting, words, typingSpeed, pauseDuration]);

    return (
      <AuroraText colors={colors} speed={speed} className={className}>
        {currentText}
        <span className="animate-pulse">|</span>
      </AuroraText>
    );
  },
);

TypingAnimation.displayName = "TypingAnimation";