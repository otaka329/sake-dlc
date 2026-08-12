import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlan } from '@/contexts/PlanContext';
import { useApp } from '@/contexts/AppContext';
import { DISH_SUGGESTIONS } from '../data/dish-suggestions';
import type { DishInput, DishCategoryWithOther } from '@sdlc/shared-types';

/**
 * 料理入力カード（US-06）
 * テキスト入力 + カテゴリサジェスト、複数追加可
 */
export function DishCard() {
  const { t } = useTranslation('plan');
  const { locale } = useApp();
  const { dishes, addDish, removeDish } = usePlan();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAdd = (name: string, category?: DishCategoryWithOther) => {
    if (!name.trim()) return;
    if (dishes.length >= 10) return; // M3: planInputSchema dishes max 10
    const dish: DishInput = {
      name: name.trim(),
      category: category || 'other',
      source: 'text',
    };
    addDish(dish);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  return (
    <div data-testid="plan-dish-card" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>{t('dish.title')}</h3>

      {/* 入力済み料理リスト */}
      {dishes.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {dishes.map((dish, index) => (
            <div key={index} data-testid={`plan-dish-item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>{dish.name}</span>
              <button
                data-testid={`plan-dish-remove-${index}`}
                onClick={() => removeDish(index)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* テキスト入力 */}
      <div style={{ position: 'relative' }}>
        <input
          data-testid="plan-dish-input"
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('dish.placeholder')}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />

        {/* サジェストドロップダウン */}
        {showSuggestions && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: '4px', maxHeight: '200px', overflow: 'auto', zIndex: 10 }}>
            {DISH_SUGGESTIONS.map((cat) => (
              <div key={cat.category} data-testid={`plan-dish-suggest-${cat.category}`}>
                <div style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '12px', color: '#666', borderBottom: '1px solid #eee' }}>
                  {locale === 'ja' ? cat.labelJa : cat.labelEn}
                </div>
                {cat.dishes
                  .filter((d) => !inputValue || (locale === 'ja' ? d.ja : d.en).toLowerCase().includes(inputValue.toLowerCase()))
                  .map((dish) => (
                    <button
                      key={dish.ja}
                      onClick={() => handleAdd(locale === 'ja' ? dish.ja : dish.en, cat.category)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      {locale === 'ja' ? dish.ja : dish.en}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        data-testid="plan-dish-add-button"
        onClick={() => handleAdd(inputValue)}
        disabled={!inputValue.trim()}
        style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {t('dish.add')}
      </button>
    </div>
  );
}
