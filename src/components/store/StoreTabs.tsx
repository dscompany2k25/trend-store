import { useState } from 'react';

interface StoreTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Inicio' },
  { id: 'products', label: 'Productos' },
  { id: 'categories', label: 'Categorías' },
];

export default function StoreTabs({ activeTab, onTabChange }: StoreTabsProps) {
  return (
    <div className="flex border-b">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab.id
              ? 'text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-foreground rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
