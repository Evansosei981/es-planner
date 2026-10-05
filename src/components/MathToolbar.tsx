import React from 'react';
import { MathText } from './MathText';

interface MathToolbarProps {
  onInsert: (symbol: string) => void;
  className?: string;
  previewText?: string;
}

export const MathToolbar: React.FC<MathToolbarProps> = ({
  onInsert,
  className = '',
  previewText
}) => {
  const symbolCategories = [
    {
      name: "Algebra & Powers",
      items: [
        { label: "x²", formula: "$x^2$", tooltip: "Power / Exponent" },
        { label: "xⁿ", formula: "$x^n$", tooltip: "Power n" },
        { label: "xᵢ", formula: "$x_i$", tooltip: "Subscript" },
        { label: "a/b", formula: "$\\frac{a}{b}$", tooltip: "Fraction" },
        { label: "√x", formula: "$\\sqrt{x}$", tooltip: "Square root" },
        { label: "ⁿ√x", formula: "$\\sqrt[n]{x}$", tooltip: "n-th root" },
        { label: "±", formula: "$\\pm$", tooltip: "Plus minus" },
        { label: "×", formula: "$\\times$", tooltip: "Times" }
      ]
    },
    {
      name: "Calculus & Limits",
      items: [
        { label: "df/dx", formula: "$\\frac{df}{dx}$", tooltip: "Derivative" },
        { label: "∫ dx", formula: "$\\int f(x) \\, dx$", tooltip: "Indefinite Integral" },
        { label: "∫ₐᵇ", formula: "$\\int_{a}^{b} f(x) \\, dx$", tooltip: "Definite Integral" },
        { label: "∑", formula: "$\\sum_{i=1}^{n} a_i$", tooltip: "Summation" },
        { label: "lim", formula: "$\\lim_{x \\to 0}$", tooltip: "Limit" },
        { label: "∞", formula: "$\\infty$", tooltip: "Infinity" },
        { label: "→", formula: "$\\to$", tooltip: "Approaches / arrow" }
      ]
    },
    {
      name: "Greek Letters",
      items: [
        { label: "π", formula: "$\\pi$", tooltip: "Pi" },
        { label: "θ", formula: "$\\theta$", tooltip: "Theta" },
        { label: "α", formula: "$\\alpha$", tooltip: "Alpha" },
        { label: "β", formula: "$\\beta$", tooltip: "Beta" },
        { label: "λ", formula: "$\\lambda$", tooltip: "Lambda" },
        { label: "σ", formula: "$\\sigma$", tooltip: "Sigma" },
        { label: "Δ", formula: "$\\Delta$", tooltip: "Delta" }
      ]
    },
    {
      name: "Relations & Sets",
      items: [
        { label: "≤", formula: "$\\le$", tooltip: "Less than or equal" },
        { label: "≥", formula: "$\\ge$", tooltip: "Greater than or equal" },
        { label: "≠", formula: "$\\ne$", tooltip: "Not equal" },
        { label: "≈", formula: "$\\approx$", tooltip: "Approximately" },
        { label: "∈", formula: "$\\in$", tooltip: "Element of" },
        { label: "⊂", formula: "$\\subset$", tooltip: "Subset" }
      ]
    }
  ];

  return (
    <div className={`space-y-2 bg-[#1A1A26] border border-white/10 rounded-2xl p-3 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span>📐</span>
          <span>Math Symbols & LaTeX Toolbar</span>
        </span>
        <span className="text-[11px] text-gray-400">Click to insert formula</span>
      </div>

      {/* Button Rows */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {symbolCategories.flatMap(cat => cat.items).map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsert(item.formula)}
            title={item.tooltip}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#7C5CFC]/20 hover:border-[#7C5CFC]/40 border border-white/5 text-gray-200 hover:text-white text-xs font-mono transition-all active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Live Preview Box */}
      {previewText && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <span className="text-[11px] font-semibold text-gray-400 block mb-1">
            Live Math Preview:
          </span>
          <div className="bg-[#12121A] border border-white/5 rounded-xl p-3 text-sm text-white min-h-[38px] flex items-center">
            <MathText content={previewText} />
          </div>
        </div>
      )}
    </div>
  );
};
