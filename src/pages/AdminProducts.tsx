import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProductDoc } from '../firebase/db';
import { Product } from '../types';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Coins, 
  Scale, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { userProfile, loading: authLoading, isStaff } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for creating/editing modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [packPrice, setPackPrice] = useState<number>(0);
  const [packSize, setPackSize] = useState<number>(0);
  const [packageUnit, setPackageUnit] = useState('瓶');
  const [unit, setUnit] = useState('匙');
  const [saving, setSaving] = useState(false);

  const fetchProductsList = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !userProfile) {
      navigate('/admin/login');
      return;
    }
    if (userProfile && userProfile.enabled) {
      fetchProductsList();
    }
  }, [userProfile, authLoading]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setPackPrice(0);
    setPackSize(0);
    setPackageUnit('瓶');
    setUnit('匙');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setPackPrice(prod.packPrice);
    setPackSize(prod.packSize);
    setPackageUnit(prod.packageUnit || '瓶');
    setUnit(prod.unit);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || packPrice <= 0 || packSize <= 0) {
      alert('請填寫完整商品名稱、容量與價格欄位！');
      return;
    }

    if (!isStaff) {
      alert('您的帳號角色無權限執行此動作！');
      return;
    }

    setSaving(true);
    try {
      const pData = {
        name: name.trim(),
        packPrice,
        packSize,
        packageUnit: packageUnit.trim(),
        unit: unit.trim()
      };

      if (editingId) {
        await updateProduct(editingId, pData);
      } else {
        await createProduct(pData);
      }
      setIsModalOpen(false);
      await fetchProductsList();
    } catch (err) {
      console.error(err);
      alert('儲存失敗，請重試。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!isStaff) {
      alert('您的帳號無權限執行此動作！');
      return;
    }
    if (window.confirm(`⚠️ 警告：確定要刪除「${name}」品項嗎？這可能影響到目前使用到此營養品的顧客配方！`)) {
      try {
        await deleteProductDoc(id);
        await fetchProductsList();
      } catch (err) {
        console.error(err);
        alert('刪除失敗，請重試。');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">正在下載營養品目錄清單...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header with add action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <Package className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 font-display">補給品品項管理</h1>
            <p className="text-xs text-slate-400 mt-0.5">維護系統中所有的營養品、包裝規格、售價、以及配膳計量單位。</p>
          </div>
        </div>

        {isStaff && (
          <button
            onClick={handleOpenAddModal}
            className="h-10 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增營養品
          </button>
        )}
      </div>

      {/* 2. Controls & Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Search header bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="搜尋產品名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-450 focus:ring-teal-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            找不到符合條件的營養品。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/20">
                  <th className="py-3 px-4">產品名稱</th>
                  <th className="py-3 px-4">包裝內容量/規格</th>
                  <th className="py-3 px-4">單包裝單位</th>
                  <th className="py-3 px-4">配膳計量單位</th>
                  <th className="py-3 px-4">整罐/整瓶/整盒售價</th>
                  {isStaff && <th className="py-3 px-4 text-right">管理操作</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{prod.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      每{prod.packageUnit || '瓶'} {prod.packSize} {prod.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        1 {prod.packageUnit || '瓶'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100 font-bold">
                        {prod.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      NT$ {prod.packPrice.toLocaleString()} / {prod.packageUnit || '瓶'}
                    </td>
                    {isStaff && (
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="inline-flex w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200 items-center justify-center transition-all"
                          title="修改資料"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="inline-flex w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 items-center justify-center transition-all"
                          title="刪除品項"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. CRUD dialog Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-500" />
                <h3 className="font-extrabold text-base">
                  {editingId ? '編輯補給品資料' : '新增補給品品項'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs body */}
            <div className="space-y-4 text-xs">
              
              {/* Product name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">產品名稱 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 雙效纖維片"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 focus:bg-white"
                />
              </div>

              {/* Package size & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    包裝內容量 *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="例如 150"
                    value={packSize || ''}
                    onChange={(e) => setPackSize(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                    單瓶售價 (NT$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="例如 1100"
                    value={packPrice || ''}
                    onChange={(e) => setPackPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Units */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">包裝單位 (如: 瓶、罐、盒)</label>
                  <input
                    type="text"
                    required
                    placeholder="例如 瓶"
                    value={packageUnit}
                    onChange={(e) => setPackageUnit(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">配餐計量單位 (如: 匙、片、粒)</label>
                  <input
                    type="text"
                    required
                    placeholder="例如 匙"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Specification explanation preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1 animate-fadeIn">
                <div className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                  規格語意預覽（確認包裝與容量關係）：
                </div>
                <p className="text-slate-500 text-[10.5px] leading-relaxed">
                  系統將呈現為：當顧客以 <span className="font-bold text-teal-600">NT$ {(packPrice || 0).toLocaleString()} 元</span> 購買 <span className="font-bold text-slate-800">1 {packageUnit || '瓶'}</span> 該產品時，
                  其中每 1 {packageUnit || '瓶'} 含有 <span className="font-bold text-slate-800">{packSize || 0} {unit || '匙'}</span>。
                </p>
              </div>

            </div>

            {/* Buttons footer */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition-colors text-xs"
              >
                取消
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-bold transition-all shadow-md text-xs flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? '正在儲存...' : '儲存'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
