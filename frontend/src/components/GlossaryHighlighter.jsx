import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GLOSSARY_TERMS, GLOSSARY_MAP } from '../data/glossaryTerms';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildGlossaryMatcher() {
  const phraseToKey = new Map();
  const variants = [];

  GLOSSARY_TERMS.forEach((entry) => {
    const phrases = [entry.term, ...(entry.aliases || []), entry.key];
    phrases.forEach((phrase) => {
      const normalized = String(phrase || '').trim().toLowerCase();
      if (!normalized) return;
      phraseToKey.set(normalized, entry.key);
      variants.push(normalized);
    });
  });

  const uniqueVariants = [...new Set(variants)].sort((a, b) => b.length - a.length);
  const pattern = uniqueVariants
    .map((phrase) => escapeRegExp(phrase).replace(/\s+/g, '\\s+'))
    .join('|');

  return {
    regex: new RegExp(`\\b(${pattern})\\b`, 'gi'),
    phraseToKey,
  };
}

function unwrapGlossaryTerms(root) {
  const highlighted = root.querySelectorAll('span.glossary-term');
  highlighted.forEach((node) => {
    const textNode = document.createTextNode(node.textContent || '');
    node.replaceWith(textNode);
  });
  root.normalize();
}

function highlightGlossaryTerms(root, matcher) {
  const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'BUTTON', 'A', 'CODE', 'PRE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parentElement = node.parentElement;
      if (!parentElement) return NodeFilter.FILTER_REJECT;
      if (skipTags.has(parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      if (parentElement.closest('.glossary-tooltip') || parentElement.closest('.glossary-term') || parentElement.closest('[data-no-glossary]')) {
        return NodeFilter.FILTER_REJECT;
      }
      const value = node.nodeValue || '';
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      matcher.regex.lastIndex = 0;
      return matcher.regex.test(value) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const text = node.nodeValue || '';
    matcher.regex.lastIndex = 0;

    let match;
    let lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let hasReplacement = false;

    while ((match = matcher.regex.exec(text)) !== null) {
      const rawMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + rawMatch.length;
      const normalized = rawMatch.toLowerCase().replace(/\s+/g, ' ').trim();
      const entryKey = matcher.phraseToKey.get(normalized);

      if (!entryKey) continue;

      if (startIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, startIndex)));
      }

      const span = document.createElement('span');
      span.className = 'glossary-term';
      span.dataset.termKey = entryKey;
      span.textContent = rawMatch;
      fragment.appendChild(span);

      lastIndex = endIndex;
      hasReplacement = true;
    }

    if (!hasReplacement) return;

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    node.replaceWith(fragment);
  });
}

export default function GlossaryHighlighter({ enabled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTerm, setActiveTerm] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const matcher = useMemo(() => buildGlossaryMatcher(), []);
  const hideTimerRef = useRef(null);
  const isOverTooltipRef = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      if (!isOverTooltipRef.current) {
        setActiveTerm(null);
      }
    }, 250);
  }, [clearHideTimer]);

  useEffect(() => {
    const root = document.querySelector('main');
    if (!root) return;

    unwrapGlossaryTerms(root);
    if (!enabled) {
      setActiveTerm(null);
      return;
    }

    highlightGlossaryTerms(root, matcher);

    const onMouseOver = (event) => {
      const termNode = event.target.closest('.glossary-term');
      if (!termNode) return;
      const key = termNode.dataset.termKey;
      if (!key || !GLOSSARY_MAP[key]) return;

      clearHideTimer();

      // Anchor tooltip to the term element's position (not the cursor)
      const rect = termNode.getBoundingClientRect();
      const tooltipWidth = 340;
      const tooltipHeight = 220;

      let x = rect.left + rect.width / 2 - tooltipWidth / 2;
      let y = rect.bottom + 8;

      // Keep within viewport
      if (x < 12) x = 12;
      if (x + tooltipWidth > window.innerWidth - 12) x = window.innerWidth - tooltipWidth - 12;
      if (y + tooltipHeight > window.innerHeight - 12) {
        y = rect.top - tooltipHeight - 8;
      }

      setTooltipPos({ x, y });
      setActiveTerm(GLOSSARY_MAP[key]);
    };

    const onMouseOut = (event) => {
      if (event.target.closest('.glossary-term')) {
        scheduleHide();
      }
    };

    root.addEventListener('mouseover', onMouseOver);
    root.addEventListener('mouseout', onMouseOut);

    return () => {
      root.removeEventListener('mouseover', onMouseOver);
      root.removeEventListener('mouseout', onMouseOut);
      unwrapGlossaryTerms(root);
      setActiveTerm(null);
      clearHideTimer();
    };
  }, [enabled, matcher, location.pathname, clearHideTimer, scheduleHide]);

  if (!enabled || !activeTerm) return null;

  return (
    <div
      className="glossary-tooltip"
      style={{
        left: `${tooltipPos.x}px`,
        top: `${tooltipPos.y}px`,
      }}
      onMouseEnter={() => {
        isOverTooltipRef.current = true;
        clearHideTimer();
      }}
      onMouseLeave={() => {
        isOverTooltipRef.current = false;
        setActiveTerm(null);
      }}
    >
      <div className="glossary-tooltip-title">{activeTerm.term}</div>
      <div className="glossary-tooltip-row">
        <span className="glossary-tooltip-label">Meaning</span>
        <p>{activeTerm.meaning}</p>
      </div>
      <div className="glossary-tooltip-row">
        <span className="glossary-tooltip-label">Why it matters</span>
        <p>{activeTerm.relevance}</p>
      </div>
      <button
        type="button"
        className="glossary-tooltip-link"
        onClick={() => {
          setActiveTerm(null);
          navigate('/app/glossary');
        }}
      >
        Learn more terms
      </button>
    </div>
  );
}
