import React, { useState } from 'react';
import { MealPlanDay, Product } from '../types';
import { Package, Clipboard, Check, HelpCircle, FileText, ShoppingCart, Sparkles } from 'lucide-react';

interface MealPlanSummaryProps {
  days: MealPlanDay[];
  products: Product[];
}

export const MealPlanSummary: React.FC<MealPlanSummaryProps> = ({ days, products }) => {
  const [copied, setCopied] = useState(false);

  // 1. Accumulate consumption for each unique product
  // Map structure: productId -> { productName, totalQuantity, unit }
  const consumptionMap: Record<string, { productName: string; totalQuantity: number; unit: string }> = {};

  days.forEach((day) => {
    day.meals?.forEach((meal) => {
      meal.items?.forEach((item) => {
        if (!item.productId) return;
        if (!consumptionMap[item.productId]) {
          consumptionMap[item.productId] = {
            productName: item.productName || '未知商品',
            totalQuantity: 0,
            unit: item.unit || '',
          };
        }
        consumptionMap[item.productId].totalQuantity += item.quantity || 0;
      });
    });
  });

  // 2. Map consumption items to their product definitions to get pack details
  const summaryItems = Object.entries(consumptionMap).map(([productId, info]) => {
    const product = products.find((p) => p.id === productId);
    
    const packSize = product?.packSize || 1; // avoid division by zero
    const packageUnit = product?.packageUnit || '件';
    const packPrice = product?.packPrice || 0;
    
    // Calculate required single package units (unconditional round-up)
    const requiredPackages = Math.ceil(info.totalQuantity / packSize);
    const totalPrice = requiredPackages * packPrice;

    return {
      productId,
      productName: info.productName,
      totalQuantity: info.totalQuantity,
      unit: info.unit || product?.unit || '單位',
      packSize,
      packageUnit,
      packPrice,
      requiredPackages,
      totalPrice,
      isMissingMeta: !product, // whether we could find product config
    };
  });

  // Sort items to put products with actual requirements first
  summaryItems.sort((a, b) => b.totalQuantity - a.totalQuantity);

  // Calculate grand totals
  const grandTotalCost = summaryItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalPackagesCount = summaryItems.reduce((sum, item) => sum + item.requiredPackages, 0);

  // Generate clean text for copy/sharing
  const handleCopyText = () => {
    if (summaryItems.length === 0) return;

    let text = `📋 【45天菜單產品需求總計】\n`;
    text += `=========================\n\n`;
    
    summaryItems.forEach((item) => {
      text += `🔹 ${item.productName}\n`;
      text += `   - 總消耗量: ${item.totalQuantity.toFixed(1)} ${item.unit}\n`;
      text += `   - 單包規格: ${item.packSize} ${item.unit}/${item.packageUnit}\n`;
      text += `   - 需購數量: ${item.requiredPackages} ${item.packageUnit} (無條件進位)\n`;
      if (item.packPrice > 0) {
        text += `   - 單價/總價: NT$ ${item.packPrice.toLocaleString()} / NT$ ${item.totalPrice.toLocaleString()}\n`;
      }
      text += `\n`;
    });

    text += `=========================\n`;
    text += `📦 總包裝件數: ${totalPackagesCount} 件\n`;
    text += `💰 預估總金額: NT$ ${grandTotalCost.toLocaleString()} 元\n`;
    text += `\n* 統計由45天客製化菜單系統自動計算。`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
              <Package className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                45 天菜單原料總計統計
              </h3>
              <p className="text-xs text-slate-400">
                自動加總整份菜單所有天數與餐次使用的產品，並根據單包規格計算出需購數量。
              </p>
            </div>
          </div>
        </div>

        {summaryItems.length > 0 && (
          <button
            onClick={handleCopyText}
            className={`h-11 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              copied
                ? 'bg-emerald-500 text-white shadow-emerald-50'
                : 'bg-blue-500 hover:bg-slate-800 text-white shadow-slate-105'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
            {copied ? '已複製統計文字!' : '一鍵複製 LINE 統計格式'}
          </button>
        )}
      </div>

      {summaryItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-400">目前 45 天中尚未添加任何含有產品品項的餐次。</p>
          <p className="text-xs text-slate-300">請先在日曆或清單編輯餐次，加入蛋白素、餐包或魚油等產品。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Main Table List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">細項清單 (單包裝進位)</h4>
              </div>
              
              <div className="divide-y divide-slate-100">
                {summaryItems.map((item) => (
                  <div key={item.productId} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                    
                    {/* Product Name & Specs */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{item.productName}</span>
                        {item.isMissingMeta && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            未匹配品項
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-x-4 text-xs text-slate-400">
                        <span>
                          單包規格：
                          <strong className="text-slate-600 font-bold">
                            {item.packSize} {item.unit}/{item.packageUnit}
                          </strong>
                        </span>
                        <span>|</span>
                        <span>
                          累計消耗：
                          <strong className="text-slate-600 font-bold">
                            {item.totalQuantity.toFixed(1)} {item.unit}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Quantity Result & Math */}
                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-dashed border-slate-100">
                      <span className="text-xs text-slate-400 sm:hidden">需購數量：</span>
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-teal-600 font-mono">
                          {item.requiredPackages}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ml-1">
                          {item.packageUnit}
                        </span>
                        
                        {/* Decimal Hint */}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ({(item.totalQuantity / item.packSize).toFixed(2)} {item.packageUnit} ➜ 進位為 {item.requiredPackages} {item.packageUnit})
                        </div>
                      </div>
                    </div>

                    {/* Cost Preview */}
                    {item.packPrice > 0 && (
                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2 shrink-0 sm:border-l sm:border-slate-100 sm:pl-6 w-full sm:w-32">
                        <span className="text-xs text-slate-400 sm:hidden font-medium">預估金額：</span>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-800 font-mono">
                            NT$ {item.totalPrice.toLocaleString()}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            單價: NT$ {item.packPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Aggregated Widget */}
          <div className="space-y-4">
            
            {/* Grand Total Widget */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-md shadow-teal-500/10 space-y-5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white/80 animate-pulse" />
                <h4 className="font-bold text-sm text-white/95 uppercase tracking-wider">採購預算摘要</h4>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-xs text-white/70 block">預估需購總包裝件數</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black font-mono">{totalPackagesCount}</span>
                    <span className="text-sm font-bold text-white/80">件商品</span>
                  </div>
                </div>

                <div className="h-px bg-white/20"></div>

                <div>
                  <span className="text-xs text-white/70 block">整套菜單預估總金額 (NTD)</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xs font-bold text-white/80">NT$</span>
                    <span className="text-3xl font-black font-mono">{grandTotalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-xl text-[11px] text-teal-50 leading-relaxed border border-white/5">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                <strong>無條件進位說明：</strong> 只要客戶實施 45 天的食量總和「超出」整包裝規格，系統即自動為您追加 1 整包 (罐/盒/瓶) 的安全庫存，確保配膳無虞！
              </div>
            </div>

            {/* Print/Share Tip */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-700 block mb-1">小提示：</strong>
                您可以點擊上方的複製按鈕，直接將這份完美的購買統計規格，透過 LINE 貼給您的客戶，方便他們一鍵採購！
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
