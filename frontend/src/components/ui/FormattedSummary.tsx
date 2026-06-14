import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Info 
} from 'lucide-react';
import { TagIcon } from './TagIcon';

interface FormattedSummaryProps {
  text: string;
}

interface Section {
  title: string | null;
  lines: string[];
}

// Map headers to premium icons and styles
const getSectionHeader = (title: string) => {
  const cleanTitle = title.replace(/^###\s*/, '').trim();
  const lower = cleanTitle.toLowerCase();
  
  if (lower.includes('what i did') || lower.includes('work completed') || lower.includes('features built') || lower.includes('bugs fixed') || lower.includes('reviews done')) {
    return {
      title: cleanTitle,
      icon: <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />,
    };
  }
  if (lower.includes('weekly review') || lower.includes('weekly summary') || lower.includes('digest')) {
    return {
      title: cleanTitle,
      icon: <Sparkles size={15} className="text-indigo-500 flex-shrink-0 animate-pulse" />,
    };
  }
  if (lower.includes('blocker')) {
    return {
      title: cleanTitle,
      icon: <AlertTriangle size={15} className="text-rose-500 flex-shrink-0" />,
    };
  }
  if (lower.includes('plan') || lower.includes('tomorrow') || lower.includes('next')) {
    return {
      title: cleanTitle,
      icon: <Calendar size={15} className="text-blue-500 flex-shrink-0" />,
    };
  }
  
  return {
    title: cleanTitle,
    icon: <Info size={15} className="text-purple-500 flex-shrink-0" />,
  };
};

// Match tags dynamically to class styles matching index.css
const getTagDetails = (tag: string) => {
  const t = tag.toLowerCase().trim();
  switch(t) {
    case 'bug': return { label: 'bug', className: 'tag-bug' };
    case 'feature': return { label: 'feature', className: 'tag-feature' };
    case 'review': return { label: 'review', className: 'tag-review' };
    case 'blocked': return { label: 'blocked', className: 'tag-blocked' };
    case 'learning': return { label: 'learning', className: 'tag-learning' };
    default: return null;
  }
};

const renderInlineContent = (text: string) => {
  let tagElement: React.ReactNode = null;
  let remainingText = text.trim();
  
  // Detect [tag] syntax at the start of lines
  const tagRegex = /^\[(bug|feature|review|blocked|learning)\]\s*/i;
  const match = remainingText.match(tagRegex);
  if (match) {
    const tagVal = match[1].toLowerCase();
    const details = getTagDetails(tagVal);
    if (details) {
      tagElement = (
        <span 
          className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full mr-2 uppercase tracking-wider ${details.className}`}
          style={{ fontSize: '9px', height: '18px', lineHeight: '18px' }}
        >
          <TagIcon tag={tagVal} size={11} className="text-current opacity-95" />
          <span>{details.label}</span>
        </span>
      );
      remainingText = remainingText.replace(tagRegex, '');
    }
  }

  // Parse markdown bold delimiters (**bold**)
  const parts = remainingText.split('**');
  const renderedParts = parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-semibold" style={{ color: 'var(--fg)' }}>{part}</strong>;
    }
    return part;
  });

  return (
    <span className="flex-1">
      {tagElement}
      {renderedParts}
    </span>
  );
};

export const FormattedSummary: React.FC<FormattedSummaryProps> = ({ text }) => {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const sections: Section[] = [];
  let currentSection: Section = { title: null, lines: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) {
      if (currentSection.title !== null || currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed, lines: [] };
    } else {
      if (trimmed !== '') {
        currentSection.lines.push(line);
      }
    }
  }
  if (currentSection.title !== null || currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return (
    <div className="space-y-4 select-text">
      {sections.map((section, sIndex) => {
        const headerInfo = section.title ? getSectionHeader(section.title) : null;
        
        return (
          <div 
            key={sIndex} 
            className="rounded-xl border p-4 transition-all duration-300 hover:shadow-sm"
            style={{ 
              backgroundColor: 'var(--bg-elev)', 
              borderColor: 'var(--line)',
            }}
          >
            {headerInfo && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed" style={{ borderColor: 'var(--line)' }}>
                {headerInfo.icon}
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg)' }}>
                  {headerInfo.title}
                </h4>
              </div>
            )}
            
            <ul className="space-y-2 list-none pl-0 m-0">
              {section.lines.map((line, lIndex) => {
                const trimmedLine = line.trim();
                const isBullet = trimmedLine.startsWith('-') || trimmedLine.startsWith('*');
                const cleanLine = isBullet ? trimmedLine.substring(1).trim() : trimmedLine;
                
                return (
                  <li key={lIndex} className="flex items-start text-xs leading-relaxed" style={{ color: 'var(--fg-dim)' }}>
                    {isBullet ? (
                      <span 
                        className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--accent)', opacity: 0.7 }}
                      />
                    ) : (
                      line.startsWith('  ') ? <span className="mr-4" /> : null
                    )}
                    {renderInlineContent(cleanLine)}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
